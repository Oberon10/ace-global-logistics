// Import Mongoose library
import mongoose from "mongoose";

// Import domain models
import Shipment, { SHIPMENT_STATUSES } from "../models/Shipment.js";
import User from "../models/User.js";
import Staff from "../models/staff.js";
import Admin from "../models/admin.js";
import { createNotification } from "./notificationController.js";

/**
 * Valid status transitions matrix enforcing strict operational logistics workflow:
 * PENDING_VERIFICATION -> VERIFIED -> READY_FOR_DISPATCH -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
 */
const ALLOWED_STATUS_TRANSITIONS = {
    "PENDING_VERIFICATION": ["VERIFIED", "REJECTED", "CANCELLED", "ON_HOLD"],
    "VERIFIED": ["READY_FOR_DISPATCH", "IN_TRANSIT", "ON_HOLD", "CANCELLED"],
    "READY_FOR_DISPATCH": ["IN_TRANSIT", "ON_HOLD", "CANCELLED"],
    "IN_TRANSIT": ["OUT_FOR_DELIVERY", "ON_HOLD", "DELIVERY_FAILED", "RETURNED"],
    "OUT_FOR_DELIVERY": ["DELIVERED", "DELIVERY_FAILED", "RETURNED", "ON_HOLD"],
    "DELIVERY_FAILED": ["OUT_FOR_DELIVERY", "RETURNED", "ON_HOLD", "DELIVERED"],
    "ON_HOLD": ["PENDING_VERIFICATION", "VERIFIED", "READY_FOR_DISPATCH", "IN_TRANSIT", "OUT_FOR_DELIVERY", "CANCELLED"],
    // Backward compatibility mappings for legacy data
    "ORDER_CREATED": ["PENDING_VERIFICATION", "VERIFIED", "PICKED_UP", "IN_TRANSIT", "CANCELLED"],
    "PICKED_UP": ["IN_TRANSIT", "READY_FOR_DISPATCH", "ON_HOLD"],
    "RETURNED": ["ON_HOLD", "DELIVERED"]
};

/**
 * Utility helper function to generate a stable, human-readable logistics tracking number.
 * Format: ACE-2026-XXXXXX (e.g., ACE-2026-819402)
 *
 * @returns {string} Unique uppercase tracking number
 */
export const generateTrackingNumber = () => {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `ACE-${year}-${randomDigits}`;
};

/**
 * Helper utility to safely parse dates without throwing Mongoose CastError on invalid strings (e.g. "Today").
 */
const parseSafeDate = (value, defaultVal = null) => {
    if (!value) return defaultVal;
    const d = new Date(value);
    return (d instanceof Date && !isNaN(d.getTime())) ? d : defaultVal;
};

/**
 * Helper utility to safely validate and return MongoDB ObjectIds.
 */
const safeObjectId = (id) => (id && mongoose.Types.ObjectId.isValid(id)) ? id : null;

/**
 * Controller: Create a new shipment booking.
 * 
 * CORE REQUIREMENT:
 * Customer creates shipment request -> Initial status is PENDING_VERIFICATION.
 * Customer submits estimated weight and dimensions.
 * Physical verification is performed subsequently by ACE Logistics staff.
 * 
 * If created by Staff for a walk-in customer:
 * Assigns customer details and enters the same lifecycle.
 */
export const createShipment = async (req, res) => {
    try {
        const { 
            origin, 
            destination, 
            packageDetails, 
            assignedDriver, 
            sender,
            trackingNumber: customTracking,
            status: customStatus,
            method,
            timeline,
            paymentStatus,
            notes
        } = req.body;

        // 1. Normalize origin: support string ("City, Country") or object
        let normalizedOrigin = {};
        if (typeof origin === "string" && origin.trim()) {
            const parts = origin.split(",").map(s => s.trim());
            normalizedOrigin = {
                address: origin.trim(),
                city: parts[0] || "Origin Hub",
                state: "",
                country: parts[1] || "Ghana",
                postalCode: ""
            };
        } else if (typeof origin === "object" && origin !== null) {
            const addr = origin.address || origin.city || origin.name || "Origin Facility Hub";
            normalizedOrigin = {
                address: String(addr).trim() || "Origin Facility Hub",
                city: origin.city || "Origin Hub",
                state: origin.state || "",
                country: origin.country || "Ghana",
                postalCode: origin.postalCode || ""
            };
        } else {
            normalizedOrigin = {
                address: "Origin Facility Hub",
                city: "Origin Hub",
                state: "",
                country: "Ghana",
                postalCode: ""
            };
        }

        // 2. Normalize destination: support string ("City, Country") or object
        let normalizedDestination = {};
        if (typeof destination === "string" && destination.trim()) {
            const parts = destination.split(",").map(s => s.trim());
            normalizedDestination = {
                address: destination.trim(),
                city: parts[0] || "Destination Hub",
                state: "",
                country: parts[1] || "United Kingdom",
                postalCode: ""
            };
        } else if (typeof destination === "object" && destination !== null) {
            const addr = destination.address || destination.city || destination.name || "Destination Facility Hub";
            normalizedDestination = {
                address: String(addr).trim() || "Destination Facility Hub",
                city: destination.city || "Destination Hub",
                state: destination.state || "",
                country: destination.country || "United Kingdom",
                postalCode: destination.postalCode || ""
            };
        } else {
            normalizedDestination = {
                address: "Destination Facility Hub",
                city: "Destination Hub",
                state: "",
                country: "United Kingdom",
                postalCode: ""
            };
        }

        // 3. Determine sender / customer reference safely
        let senderId = null;
        let candidateSender = sender || req.user?.id;
        if (candidateSender && typeof candidateSender === "string" && mongoose.Types.ObjectId.isValid(candidateSender)) {
            senderId = candidateSender;
        } else if (candidateSender && typeof candidateSender === "object" && candidateSender._id && mongoose.Types.ObjectId.isValid(candidateSender._id)) {
            senderId = candidateSender._id;
        }

        // If staff created the shipment and provided customer email, lookup user if exists
        let senderEmailInput = typeof sender === "object" ? sender.email : "";
        if (!senderId && senderEmailInput) {
            const matchedUser = await User.findOne({ email: senderEmailInput.trim().toLowerCase() });
            if (matchedUser) senderId = matchedUser._id;
        }

        // Driver identifier
        let driverId = safeObjectId(assignedDriver);

        // 4. Stable unique tracking number generation
        let trackingNumber = customTracking 
            ? String(customTracking).trim().toUpperCase() 
            : generateTrackingNumber();

        let exists = await Shipment.findOne({ trackingNumber });
        if (exists) {
            if (customTracking) {
                trackingNumber = `${trackingNumber}-${Math.floor(100 + Math.random() * 900)}`;
            }
            while (await Shipment.findOne({ trackingNumber })) {
                trackingNumber = generateTrackingNumber();
            }
        }

        // 5. Initial status enforcement
        // Customer submissions ALWAYS start as PENDING_VERIFICATION
        let initialStatus = "PENDING_VERIFICATION";
        const callerRole = (req.user?.role || "CUSTOMER").toUpperCase();

        // Staff or Admin can optionally set an explicit initial status if booking on-site
        if ((callerRole === "STAFF" || callerRole === "ADMIN" || callerRole === "SUPER_ADMIN") && customStatus) {
            const cleaned = String(customStatus).trim().toUpperCase().replace(/\s+/g, "_");
            if (SHIPMENT_STATUSES.includes(cleaned)) {
                initialStatus = cleaned;
            }
        }

        // Sender details extraction
        let senderDetailsObj = {};
        if (sender && typeof sender === "object") {
            senderDetailsObj = {
                name: sender.name || "",
                company: sender.company || "",
                phone: sender.phone || "",
                email: sender.email || "",
                address: sender.address || normalizedOrigin.address,
                city: sender.city || normalizedOrigin.city,
                country: sender.country || normalizedOrigin.country
            };
        } else if (req.user) {
            senderDetailsObj = {
                name: req.user.name || "",
                company: req.user.company || "",
                phone: req.user.phone || "",
                email: req.user.email || "",
                address: normalizedOrigin.address,
                city: normalizedOrigin.city,
                country: normalizedOrigin.country
            };
        }

        // Receiver details extraction
        let receiverDetailsObj = {};
        const inputReceiver = req.body.receiver;
        if (inputReceiver && typeof inputReceiver === "object") {
            receiverDetailsObj = {
                name: inputReceiver.name || "",
                company: inputReceiver.company || "",
                phone: inputReceiver.phone || "",
                email: inputReceiver.email || "",
                address: inputReceiver.address || normalizedDestination.address,
                city: inputReceiver.city || normalizedDestination.city,
                country: inputReceiver.country || normalizedDestination.country
            };
        }

        // Customer display name
        const customerDisplayName = req.body.customer 
            || senderDetailsObj.company 
            || senderDetailsObj.name 
            || (typeof sender === "string" ? sender : "") 
            || "Commercial Freight Consignor";

        // 6. Package details: preserve estimated vs verified measurements
        const pkg = packageDetails || req.body.package || {};
        const rawWeight = Number(pkg.estimatedWeight || pkg.weightKg || pkg.weight) || 1.0;
        const rawDimensions = String(pkg.estimatedDimensions || pkg.dimensions || "");

        const normalizedPackage = {
            estimatedWeight: rawWeight,
            actualWeight: pkg.actualWeight ? Number(pkg.actualWeight) : null,
            weightKg: pkg.actualWeight ? Number(pkg.actualWeight) : rawWeight,
            estimatedDimensions: rawDimensions,
            actualDimensions: String(pkg.actualDimensions || ""),
            dimensions: pkg.actualDimensions ? String(pkg.actualDimensions) : rawDimensions,
            condition: String(pkg.condition || "Intact / Standard Packaging"),
            specialHandling: String(pkg.specialHandling || notes || ""),
            verificationNotes: String(pkg.verificationNotes || ""),
            category: String(pkg.category || pkg.type || method || "General Freight"),
            pieces: Number(pkg.pieces) || 1,
            declaredValue: String(pkg.declaredValue || ""),
            insurance: String(pkg.insurance || "Standard Commercial Liability"),
            sealNumber: String(pkg.sealNumber || `ACE-SL-${trackingNumber.slice(-5)}`),
            estimatedDelivery: parseSafeDate(pkg.estimatedDelivery, null)
        };

        const shippingMethodName = String(method || req.body.shippingMethod || "Air Freight Priority");

        const normalizedCharges = {
            freight: Number(req.body.charges?.freight) || 0,
            fuelSurcharge: Number(req.body.charges?.fuelSurcharge || req.body.charges?.fuel) || 0,
            customsHandling: Number(req.body.charges?.customsHandling || req.body.charges?.customs) || 35,
            total: Number(req.body.charges?.total) || 0
        };

        // 7. Initial status history audit trail
        let initialHistory = [];
        const fallbackUserId = safeObjectId(req.user?.id) || safeObjectId(senderId);

        if (Array.isArray(timeline) && timeline.length > 0) {
            initialHistory = timeline.map(t => ({
                status: initialStatus,
                location: t.location || normalizedOrigin.city || "Intake Terminal",
                description: t.description || t.title || "Shipment request registered in ACE Logistics network.",
                note: t.note || "Initial electronic manifest creation.",
                timestamp: parseSafeDate(t.timestamp || t.date, new Date()),
                updatedBy: fallbackUserId,
                changedByRole: callerRole
            }));
        } else {
            initialHistory = [{
                status: initialStatus,
                location: normalizedOrigin.city || normalizedOrigin.address || "Intake Terminal",
                description: initialStatus === "PENDING_VERIFICATION"
                    ? "Shipment request received. Physical package verification pending at intake terminal."
                    : `Shipment order created with status ${initialStatus}.`,
                note: "Consignment created online / intake desk.",
                timestamp: new Date(),
                updatedBy: fallbackUserId,
                changedByRole: callerRole
            }];
        }

        // Creator identification
        const createdById = fallbackUserId;
        const createdByRole = callerRole;

        // 8. Persist new shipment in MongoDB
        const newShipment = await Shipment.create({
            trackingNumber,
            sender: safeObjectId(senderId),
            assignedDriver: driverId,
            assignedStaff: safeObjectId(req.body.assignedStaff),
            origin: normalizedOrigin,
            destination: normalizedDestination,
            currentStatus: initialStatus,
            shipmentStatus: initialStatus,
            paymentStatus: paymentStatus || "PENDING",
            createdBy: createdById,
            createdByRole,
            trackingHistory: initialHistory,
            packageDetails: normalizedPackage,
            customer: customerDisplayName,
            shippingMethod: shippingMethodName,
            senderDetails: senderDetailsObj,
            receiver: receiverDetailsObj,
            charges: normalizedCharges
        });

        // 9. Dispatch in-app notifications safely without blocking response
        try {
            if (senderDetailsObj.email || safeObjectId(senderId)) {
                await createNotification({
                    recipient: safeObjectId(senderId),
                    recipientEmail: senderDetailsObj.email,
                    recipientRole: "CUSTOMER",
                    shipment: newShipment._id,
                    trackingNumber,
                    title: "Shipment Request Received",
                    message: `Your shipment request ${trackingNumber} has been received. Consignment is pending physical verification by ACE Logistics staff.`,
                    type: "REQUEST_CREATED"
                });
            }

            await createNotification({
                recipient: null,
                recipientRole: "STAFF",
                shipment: newShipment._id,
                trackingNumber,
                title: "New Consignment Pending Verification",
                message: `Consignment ${trackingNumber} from ${customerDisplayName} (${normalizedOrigin.city} → ${normalizedDestination.city}) awaits package inspection.`,
                type: "REQUEST_CREATED"
            });
        } catch (notifErr) {
            console.warn("⚠️ Non-fatal notification error during shipment creation:", notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Shipment request created successfully. Awaiting staff package verification.",
            shipment: newShipment
        });
    } catch (error) {
        console.error("❌ Error in createShipment controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create shipment. Please verify shipment data.",
            error: error.message
        });
    }
};

/**
 * Controller: Staff Package Verification
 * 
 * CORE REQUIREMENT:
 * Staff opens shipment in PENDING_VERIFICATION and records:
 * - Actual weight
 * - Actual dimensions
 * - Package condition
 * - Special handling requirements
 * - Verification notes
 * 
 * Sets status to VERIFIED (or REJECTED), records staff ID and timestamp,
 * preserves customer's estimates, and updates shipment history.
 */
export const verifyShipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            actualWeight, 
            actualDimensions, 
            condition, 
            specialHandling, 
            verificationNotes, 
            decision = "APPROVE",
            sealNumber,
            location
        } = req.body;

        // Role authorization check: only staff or admin may verify
        const userRole = (req.user?.role || "").toUpperCase();
        const allowedRoles = ["STAFF", "DISPATCHER", "OPERATOR", "WAREHOUSE_OPERATOR", "CUSTOMS_OFFICER", "TERMINAL_DISPATCHER", "ADMIN", "SUPER_ADMIN"];
        if (req.user && !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: User role '${userRole}' is not authorized to verify shipments. Staff credentials required.`
            });
        }

        // Locate shipment by ID or trackingNumber
        const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { trackingNumber: id.toUpperCase() };
        const shipment = await Shipment.findOne(filter);

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: `Shipment with identifier '${id}' not found.`
            });
        }

        const isRejection = decision.toUpperCase() === "REJECT";
        const newStatus = isRejection ? "REJECTED" : "VERIFIED";

        // Verification payload updates
        const verifiedWeight = actualWeight !== undefined && actualWeight !== null 
            ? Number(actualWeight) 
            : (shipment.packageDetails?.estimatedWeight || shipment.packageDetails?.weightKg || 1.0);
        
        const verifiedDims = actualDimensions || shipment.packageDetails?.estimatedDimensions || shipment.packageDetails?.dimensions || "";
        const verifiedCondition = condition || "Good / Intact";
        const notesText = verificationNotes || (isRejection ? "Package rejected during physical intake." : "Package physically inspected, weighed, and verified.");

        // Construct history checkpoint
        const historyLog = {
            status: newStatus,
            location: location || shipment.origin?.city || "Intake Terminal",
            description: isRejection
                ? `Package rejected at physical intake: ${notesText}`
                : `Physical package verified. Actual weight: ${verifiedWeight}kg, dimensions: ${verifiedDims}. Condition: ${verifiedCondition}.`,
            note: notesText,
            timestamp: new Date(),
            updatedBy: req.user?.id || null,
            changedByRole: userRole || "STAFF"
        };

        // Recalculate freight charge based on actual weight if approved and freight exists
        let updatedCharges = { ...(shipment.charges?.toObject ? shipment.charges.toObject() : shipment.charges) };
        if (!isRejection && verifiedWeight > 0 && updatedCharges.freight > 0) {
            const oldWeight = shipment.packageDetails?.estimatedWeight || 1;
            const ratePerKg = oldWeight > 0 ? (updatedCharges.freight / oldWeight) : 10;
            const newFreight = Math.round(verifiedWeight * ratePerKg);
            const newFuel = Math.round(newFreight * 0.12);
            updatedCharges.freight = newFreight;
            updatedCharges.fuelSurcharge = newFuel;
            updatedCharges.total = newFreight + newFuel + (updatedCharges.customsHandling || 35);
        }

        // Execute atomic update
        shipment.currentStatus = newStatus;
        shipment.shipmentStatus = newStatus;
        shipment.verifiedBy = req.user?.id || null;
        shipment.verifiedAt = new Date();
        shipment.verificationNotes = notesText;
        shipment.assignedStaff = req.user?.id || shipment.assignedStaff;

        // Ensure packageDetails object is updated while preserving estimates
        if (!shipment.packageDetails) shipment.packageDetails = {};
        shipment.packageDetails.actualWeight = verifiedWeight;
        shipment.packageDetails.weightKg = verifiedWeight;
        shipment.packageDetails.actualDimensions = verifiedDims;
        shipment.packageDetails.dimensions = verifiedDims;
        shipment.packageDetails.condition = verifiedCondition;
        if (specialHandling) shipment.packageDetails.specialHandling = specialHandling;
        shipment.packageDetails.verificationNotes = notesText;
        if (sealNumber) shipment.packageDetails.sealNumber = sealNumber;

        shipment.charges = updatedCharges;
        shipment.trackingHistory.push(historyLog);

        await shipment.save();

        const populatedShipment = await Shipment.findById(shipment._id)
            .populate("sender", "name email")
            .populate("verifiedBy", "name email station department")
            .populate("assignedDriver", "name email");

        // Send customer notification
        const customerEmail = shipment.senderDetails?.email || (shipment.sender?.email);
        await createNotification({
            recipient: shipment.sender?._id || shipment.sender,
            recipientEmail: customerEmail,
            recipientRole: "CUSTOMER",
            shipment: shipment._id,
            trackingNumber: shipment.trackingNumber,
            title: isRejection ? "Shipment Rejected at Intake" : "Shipment Package Verified",
            message: isRejection
                ? `Consignment ${shipment.trackingNumber} was rejected during physical verification: ${notesText}`
                : `Consignment ${shipment.trackingNumber} has been verified at the terminal. Actual weight: ${verifiedWeight}kg. Status is now VERIFIED.`,
            type: isRejection ? "EXCEPTION" : "VERIFICATION"
        });

        return res.status(200).json({
            success: true,
            message: isRejection 
                ? "Shipment has been rejected." 
                : "Package verified successfully. Measurements and condition recorded.",
            shipment: populatedShipment
        });
    } catch (error) {
        console.error("❌ Error in verifyShipment controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify shipment.",
            error: error.message
        });
    }
};

/**
 * Controller: Update shipment lifecycle status with strict transition rules.
 * 
 * CORE RULES:
 * - Customers CANNOT manually change status.
 * - Staff can perform status transitions permitted by their role.
 * - Admin/Super Admin can override (recorded in audit log).
 * - Appends audit record to trackingHistory with user ID, role, note, location, timestamp.
 */
export const updateShipmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, location, description, note } = req.body;

        // Role authorization check: customers must never manually change status
        const userRole = (req.user?.role || "GUEST").toUpperCase();
        if (userRole === "CUSTOMER" || userRole === "CLIENT" || userRole === "USER") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Customers are not permitted to change shipment status. Status is managed by operations staff."
            });
        }

        // Normalize status code
        let normalizedStatus = String(status || "").trim().toUpperCase().replace(/\s+/g, "_");
        if (normalizedStatus === "TRANSIT") normalizedStatus = "IN_TRANSIT";

        if (!normalizedStatus || !SHIPMENT_STATUSES.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status '${status}'. Allowed values: [${SHIPMENT_STATUSES.join(", ")}].`
            });
        }

        // Find shipment
        const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { trackingNumber: id.toUpperCase() };
        const shipment = await Shipment.findOne(filter);

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: `Shipment with identifier '${id}' not found.`
            });
        }

        const currentStatus = shipment.currentStatus || "PENDING_VERIFICATION";

        // Check status transition rules
        const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
        const isTransitionAllowed = allowedNext.includes(normalizedStatus);
        const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

        if (!isTransitionAllowed && !isAdmin) {
            return res.status(400).json({
                success: false,
                message: `Invalid operational transition: Cannot move shipment from '${currentStatus}' to '${normalizedStatus}'. Allowed next stages: [${allowedNext.join(", ")}].`
            });
        }

        // Note construction (flags administrative overrides)
        let auditNote = note || description || `Status updated from ${currentStatus} to ${normalizedStatus}.`;
        if (!isTransitionAllowed && isAdmin) {
            auditNote = `[Admin Override] ${auditNote}`;
        }

        const checkpointLocation = location || shipment.currentLocation || shipment.origin?.city || "Transit Waypoint";

        // Construct history log
        const newHistoryLog = {
            status: normalizedStatus,
            location: checkpointLocation,
            description: description || `Consignment advanced to ${normalizedStatus.replace(/_/g, ' ')}.`,
            note: auditNote,
            timestamp: new Date(),
            updatedBy: req.user?.id || null,
            changedByRole: userRole || "STAFF"
        };

        // Update shipment
        shipment.currentStatus = normalizedStatus;
        shipment.shipmentStatus = normalizedStatus;
        shipment.trackingHistory.push(newHistoryLog);

        await shipment.save();

        const updatedShipment = await Shipment.findById(shipment._id)
            .populate("sender", "name email")
            .populate("verifiedBy", "name email")
            .populate("assignedDriver", "name email");

        // Dispatch status update in-app notification
        const customerEmail = shipment.senderDetails?.email || shipment.sender?.email;
        const readableStatus = normalizedStatus.replace(/_/g, ' ');

        await createNotification({
            recipient: shipment.sender?._id || shipment.sender,
            recipientEmail: customerEmail,
            recipientRole: "CUSTOMER",
            shipment: shipment._id,
            trackingNumber: shipment.trackingNumber,
            title: `Shipment Milestone: ${readableStatus}`,
            message: `Shipment ${shipment.trackingNumber} has reached stage '${readableStatus}' at ${checkpointLocation}.`,
            type: normalizedStatus === "DELIVERED" ? "DELIVERY" : "STATUS_UPDATE"
        });

        return res.status(200).json({
            success: true,
            message: `Shipment status updated successfully to ${normalizedStatus}.`,
            shipment: updatedShipment
        });
    } catch (error) {
        console.error("❌ Error in updateShipmentStatus controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update shipment status.",
            error: error.message
        });
    }
};

/**
 * Controller: Retrieve all shipments with strict role-aware scoping and data ownership.
 * 
 * CORE REQUIREMENT:
 * Customer users receive ONLY their own shipments (enforced on the backend).
 * Staff and Admin receive operational shipments.
 */
export const getAllShipments = async (req, res) => {
    try {
        let queryFilter = {};

        // Data ownership isolation for customer users
        if (req.user?.role === "CUSTOMER" || req.user?.role === "CLIENT" || req.user?.role === "USER") {
            const userEmail = (req.user.email || "").trim().toLowerCase();
            const userId = req.user.id;

            queryFilter = {
                $or: [
                    { sender: userId },
                    { createdBy: userId },
                    { "senderDetails.email": userEmail },
                    { "receiver.email": userEmail }
                ]
            };
        } else if (req.user?.role === "DRIVER") {
            queryFilter.assignedDriver = req.user.id;
        }

        const shipments = await Shipment.find(queryFilter)
            .sort({ createdAt: -1 })
            .populate("sender", "name email")
            .populate("verifiedBy", "name email station department")
            .populate("assignedDriver", "name email");

        return res.status(200).json({
            success: true,
            count: shipments.length,
            shipments
        });
    } catch (error) {
        console.error("❌ Error in getAllShipments controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve shipments.",
            error: error.message
        });
    }
};

/**
 * Controller: Retrieve single shipment by its MongoDB ObjectId.
 * 
 * CORE REQUIREMENT:
 * Enforces data ownership so Customer A cannot access Customer B's shipment.
 */
export const getShipmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { trackingNumber: id.toUpperCase() };
        const shipment = await Shipment.findOne(filter)
            .populate("sender", "name email")
            .populate("verifiedBy", "name email station department")
            .populate("assignedDriver", "name email");

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: `Shipment with identifier '${id}' not found.`
            });
        }

        // Customer data ownership verification
        if (req.user && (req.user.role === "CUSTOMER" || req.user.role === "CLIENT" || req.user.role === "USER")) {
            const userEmail = (req.user.email || "").trim().toLowerCase();
            const userId = String(req.user.id);
            const senderIdStr = String(shipment.sender?._id || shipment.sender || "");
            const createdByIdStr = String(shipment.createdBy || "");
            const senderEmail = (shipment.senderDetails?.email || "").toLowerCase();
            const receiverEmail = (shipment.receiver?.email || "").toLowerCase();

            const isOwner = (senderIdStr && senderIdStr === userId) 
                         || (createdByIdStr && createdByIdStr === userId)
                         || (userEmail && senderEmail === userEmail) 
                         || (userEmail && receiverEmail === userEmail);

            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You are not authorized to view another customer's consignment."
                });
            }
        }

        return res.status(200).json({
            success: true,
            shipment
        });
    } catch (error) {
        console.error("❌ Error in getShipmentById controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve shipment details.",
            error: error.message
        });
    }
};

/**
 * Controller: Public tracking endpoint by tracking number.
 * Publicly searchable for any receiver or shipper tracking progress.
 */
export const getShipmentByTrackingNumber = async (req, res) => {
    try {
        const { trackingNumber } = req.params;

        const shipment = await Shipment.findOne({
            trackingNumber: trackingNumber.trim().toUpperCase()
        })
            .populate("sender", "name email")
            .populate("verifiedBy", "name email station department")
            .populate("assignedDriver", "name email");

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: `No shipment found matching tracking number '${trackingNumber}'.`
            });
        }

        return res.status(200).json({
            success: true,
            shipment
        });
    } catch (error) {
        console.error("❌ Error in getShipmentByTrackingNumber controller:", error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving shipment tracking details.",
            error: error.message
        });
    }
};

/**
 * Controller: Admin & Staff Operational Statistics
 * 
 * CORE REQUIREMENT:
 * Aggregates real operational data from MongoDB collections (no hardcoded or fake statistics):
 * - Users: Total, Customers, Staff, Admins
 * - Shipments: Total, Today, Yesterday, Monthly, and breakdown by status
 * - Revenue: Today, Yesterday, Monthly, Total
 */
export const getShipmentStats = async (req, res) => {
    try {
        // Date boundaries
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        // 1. Parallel user counts across collections
        const [totalUsers, totalStaff, totalAdmins] = await Promise.all([
            User.countDocuments({}),
            Staff.countDocuments({}),
            Admin.countDocuments({})
        ]);

        // 2. Shipment counts by timeframe
        const [
            totalShipments,
            todayShipments,
            yesterdayShipments,
            monthlyShipments
        ] = await Promise.all([
            Shipment.countDocuments({}),
            Shipment.countDocuments({ createdAt: { $gte: startOfToday } }),
            Shipment.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
            Shipment.countDocuments({ createdAt: { $gte: startOfMonth } })
        ]);

        // 3. Shipment counts grouped by currentStatus
        const statusAggregation = await Shipment.aggregate([
            {
                $group: {
                    _id: "$currentStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusCounts = {
            PENDING_VERIFICATION: 0,
            VERIFIED: 0,
            READY_FOR_DISPATCH: 0,
            IN_TRANSIT: 0,
            OUT_FOR_DELIVERY: 0,
            DELIVERED: 0,
            CANCELLED: 0,
            REJECTED: 0,
            ON_HOLD: 0,
            DELIVERY_FAILED: 0
        };

        statusAggregation.forEach(item => {
            const key = item._id || "PENDING_VERIFICATION";
            if (key === "ORDER_CREATED") statusCounts.PENDING_VERIFICATION += item.count;
            else if (key === "PICKED_UP") statusCounts.IN_TRANSIT += item.count;
            else if (statusCounts[key] !== undefined) statusCounts[key] = item.count;
            else statusCounts[key] = item.count;
        });

        // 4. Revenue aggregation from charges.total
        const [totalRevenueAgg, todayRevenueAgg, yesterdayRevenueAgg, monthlyRevenueAgg] = await Promise.all([
            Shipment.aggregate([
                { $group: { _id: null, total: { $sum: "$charges.total" } } }
            ]),
            Shipment.aggregate([
                { $match: { createdAt: { $gte: startOfToday } } },
                { $group: { _id: null, total: { $sum: "$charges.total" } } }
            ]),
            Shipment.aggregate([
                { $match: { createdAt: { $gte: startOfYesterday, $lt: startOfToday } } },
                { $group: { _id: null, total: { $sum: "$charges.total" } } }
            ]),
            Shipment.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$charges.total" } } }
            ])
        ]);

        const revenue = {
            total: totalRevenueAgg[0]?.total || 0,
            today: todayRevenueAgg[0]?.total || 0,
            yesterday: yesterdayRevenueAgg[0]?.total || 0,
            monthly: monthlyRevenueAgg[0]?.total || 0
        };

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            users: {
                total: totalUsers + totalStaff + totalAdmins,
                customers: totalUsers,
                staff: totalStaff,
                admins: totalAdmins
            },
            shipments: {
                total: totalShipments,
                today: todayShipments,
                yesterday: yesterdayShipments,
                monthly: monthlyShipments,
                byStatus: statusCounts
            },
            revenue
        });
    } catch (error) {
        console.error("❌ Error in getShipmentStats controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compile operational statistics.",
            error: error.message
        });
    }
};

/**
 * Controller: Delete a shipment by MongoDB ObjectId or unique trackingNumber.
 */
export const deleteShipment = async (req, res) => {
    try {
        const { id } = req.params;

        // Only staff or admin may delete
        const userRole = (req.user?.role || "").toUpperCase();
        if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only Executive Administrators can delete consignments."
            });
        }

        const filter = mongoose.Types.ObjectId.isValid(id)
            ? { _id: id }
            : { trackingNumber: id.trim().toUpperCase() };

        const deleted = await Shipment.findOneAndDelete(filter);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: `Shipment with identifier '${id}' not found.`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shipment deleted successfully from MongoDB.",
            trackingNumber: deleted.trackingNumber
        });
    } catch (error) {
        console.error("❌ Error in deleteShipment controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete shipment from MongoDB.",
            error: error.message
        });
    }
};

export default {
    createShipment,
    verifyShipment,
    updateShipmentStatus,
    getShipmentByTrackingNumber,
    getAllShipments,
    getShipmentById,
    getShipmentStats,
    deleteShipment,
    generateTrackingNumber
};
