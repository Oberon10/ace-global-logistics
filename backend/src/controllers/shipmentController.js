// Import Mongoose library
import mongoose from "mongoose";

// Import the Mongoose Shipment data model
import Shipment from "../models/Shipment.js";

/**
 * Utility helper function to generate a unique, human-readable logistics tracking number.
 * Format: ACE-XXXXXX-YYYY (e.g., ACE-M1X8PQ-7294)
 *
 * @returns {string} Unique uppercase tracking number
 */
const generateTrackingNumber = () => {
    // Generate timestamp component converted to base-36 alphanumeric string
    const timestampPart = Date.now().toString(36).toUpperCase();

    // Generate random 4-digit numeric code
    const randomPart = Math.floor(1000 + Math.random() * 9000);

    // Combine prefix and random fragments into standardized ACE tracking format
    return `ACE-${timestampPart}-${randomPart}`;
};

/**
 * Controller: Create a new logistics shipment.
 * Automatically handles both object and string formats for origin & destination,
 * validates sender/driver ObjectId references safely, preserves client tracking numbers,
 * initializes currentStatus to 'ORDER_CREATED' or custom status, and saves to MongoDB.
 */
export const createShipment = async (req, res) => {
    try {
        // Extract shipment payload fields from incoming HTTP request body
        const { 
            origin, 
            destination, 
            packageDetails, 
            assignedDriver, 
            sender,
            trackingNumber: customTracking,
            status: customStatus,
            method,
            timeline
        } = req.body;

        // Normalize origin: support string ("City, Country") or object
        let normalizedOrigin = {};
        if (typeof origin === "string") {
            const parts = origin.split(",").map(s => s.trim());
            normalizedOrigin = {
                address: origin,
                city: parts[0] || "Origin Hub",
                state: "",
                country: parts[1] || "USA",
                postalCode: ""
            };
        } else if (typeof origin === "object" && origin !== null) {
            normalizedOrigin = {
                address: origin.address || origin.city || "Origin Facility",
                city: origin.city || "Origin Facility",
                state: origin.state || "",
                country: origin.country || "USA",
                postalCode: origin.postalCode || ""
            };
        } else {
            normalizedOrigin = {
                address: "Origin Facility Hub",
                city: "Origin Hub",
                state: "",
                country: "USA",
                postalCode: ""
            };
        }

        // Normalize destination: support string ("City, Country") or object
        let normalizedDestination = {};
        if (typeof destination === "string") {
            const parts = destination.split(",").map(s => s.trim());
            normalizedDestination = {
                address: destination,
                city: parts[0] || "Destination Hub",
                state: "",
                country: parts[1] || "USA",
                postalCode: ""
            };
        } else if (typeof destination === "object" && destination !== null) {
            normalizedDestination = {
                address: destination.address || destination.city || "Destination Facility",
                city: destination.city || "Destination Facility",
                state: destination.state || "",
                country: destination.country || "USA",
                postalCode: destination.postalCode || ""
            };
        } else {
            normalizedDestination = {
                address: "Destination Facility Hub",
                city: "Destination Hub",
                state: "",
                country: "USA",
                postalCode: ""
            };
        }

        // Determine sender user ID safely (only set if valid MongoDB ObjectId)
        let senderId = null;
        const candidateSender = sender || req.user?.id;
        if (candidateSender && typeof candidateSender === "string" && mongoose.Types.ObjectId.isValid(candidateSender)) {
            senderId = candidateSender;
        }

        // Validate driver identifier
        let driverId = null;
        if (assignedDriver && typeof assignedDriver === "string" && mongoose.Types.ObjectId.isValid(assignedDriver)) {
            driverId = assignedDriver;
        }

        // Use custom tracking identifier if provided, else generate new
        const trackingNumber = customTracking 
            ? String(customTracking).trim().toUpperCase() 
            : generateTrackingNumber();

        // Normalize initial status to schema enum
        let initialStatus = "ORDER_CREATED";
        if (customStatus) {
            const cleaned = String(customStatus).trim().toUpperCase().replace(/\s+/g, "_");
            const valid = ["ORDER_CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION", "CANCELLED"];
            if (valid.includes(cleaned)) {
                initialStatus = cleaned;
            } else if (cleaned === "TRANSIT") {
                initialStatus = "IN_TRANSIT";
            }
        }

        // Construct initial tracking audit trail log
        const initialTrackingLog = {
            status: initialStatus,
            location: normalizedOrigin.city || normalizedOrigin.address || "Origin Hub",
            description: "Shipment order created and registered in the ACE logistics system.",
            timestamp: new Date(),
            updatedBy: senderId
        };

        // Normalize package details
        const normalizedPackage = {
            weightKg: Number(packageDetails?.weightKg || packageDetails?.weight) || 1.0,
            category: String(packageDetails?.category || packageDetails?.type || method || "General Freight"),
            estimatedDelivery: packageDetails?.estimatedDelivery ? new Date(packageDetails.estimatedDelivery) : null
        };

        // Persist the new shipment document in MongoDB collection
        const newShipment = await Shipment.create({
            trackingNumber,
            sender: senderId,
            assignedDriver: driverId,
            origin: normalizedOrigin,
            destination: normalizedDestination,
            currentStatus: initialStatus,
            trackingHistory: [initialTrackingLog],
            packageDetails: normalizedPackage
        });

        // Return HTTP 201 Created status code along with the created shipment
        return res.status(201).json({
            success: true,
            message: "Shipment created successfully and stored in MongoDB.",
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
 * Controller: Update the status of an existing shipment.
 * Uses MongoDB $set to update currentStatus and $push to append a new audit log
 * into the trackingHistory array.
 */
export const updateShipmentStatus = async (req, res) => {
    try {
        // Extract shipment identifier from URL request route parameters
        const { id } = req.params;

        // Extract status update fields from incoming HTTP request body
        const { status, location, description } = req.body;

        // Normalize status to uppercase underscore format
        let normalizedStatus = String(status || "").trim().toUpperCase().replace(/\s+/g, "_");
        if (normalizedStatus === "TRANSIT") normalizedStatus = "IN_TRANSIT";

        // List of permitted shipment status enum values
        const allowedStatuses = [
            "ORDER_CREATED",
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "EXCEPTION",
            "CANCELLED"
        ];

        // Validate that status parameter is provided and exists in allowedStatuses array
        if (!status || !allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: [${allowedStatuses.join(", ")}].`
            });
        }

        let updatedById = null;
        if (req.user?.id && typeof req.user.id === "string" && mongoose.Types.ObjectId.isValid(req.user.id)) {
            updatedById = req.user.id;
        }

        // Construct new tracking history audit log object
        const newHistoryLog = {
            status: normalizedStatus,
            location: location || "Transit Hub",
            description: description || `Shipment status updated to ${normalizedStatus}.`,
            timestamp: new Date(),
            updatedBy: updatedById
        };

        // Determine query filter: support MongoDB _id or trackingNumber
        const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { trackingNumber: id.toUpperCase() };

        // Execute atomic update: $set new currentStatus and $push new history entry
        const updatedShipment = await Shipment.findOneAndUpdate(
            filter,
            {
                $set: { currentStatus: normalizedStatus },
                $push: { trackingHistory: newHistoryLog }
            },

            // Options: return updated document and run Mongoose schema validators
            {
                // Return document after update has been applied
                new: true,
                // Validate modified fields against schema rules
                runValidators: true
            }
        ).populate("sender", "name email").populate("assignedDriver", "name email");

        // Verify that shipment document was located and updated
        if (!updatedShipment) {
            // Return HTTP 404 Not Found if shipment does not exist
            return res.status(404).json({
                // Boolean failure indicator
                success: false,
                // Error message
                message: `Shipment with identifier '${id}' not found.`
            });
        }

        // Return HTTP 200 OK status code with updated shipment document
        return res.status(200).json({
            // Boolean success indicator
            success: true,
            // Confirmation message
            message: "Shipment status updated successfully.",
            // Updated shipment document
            shipment: updatedShipment
        });
    } catch (error) {
        // Output detailed server error to console
        console.error("❌ Error in updateShipmentStatus controller:", error);

        // Return HTTP 500 Internal Server Error response
        return res.status(500).json({
            // Boolean failure indicator
            success: false,
            // Error message
            message: "Failed to update shipment status.",
            // Detailed technical error message
            error: error.message
        });
    }
};

/**
 * Controller: Retrieve shipment details by tracking number.
 * Public endpoint enabling customers to track parcels without mandatory authentication.
 */
export const getShipmentByTrackingNumber = async (req, res) => {
    try {
        // Extract tracking number parameter from URL route
        const { trackingNumber } = req.params;

        // Search for shipment in MongoDB matching normalized tracking number
        const shipment = await Shipment.findOne({
            // Case-insensitive uppercase search
            trackingNumber: trackingNumber.trim().toUpperCase()
        })
            .populate("sender", "name email")
            .populate("assignedDriver", "name email");

        // Check if matching shipment was found
        if (!shipment) {
            // Return HTTP 404 Not Found if tracking number does not exist
            return res.status(404).json({
                // Boolean failure indicator
                success: false,
                // Error message
                message: `No shipment found matching tracking number '${trackingNumber}'.`
            });
        }

        // Return HTTP 200 OK status code with shipment tracking information
        return res.status(200).json({
            // Boolean success indicator
            success: true,
            // Shipment document
            shipment
        });
    } catch (error) {
        // Output detailed server error to console
        console.error("❌ Error in getShipmentByTrackingNumber controller:", error);

        // Return HTTP 500 Internal Server Error response
        return res.status(500).json({
            // Boolean failure indicator
            success: false,
            // Error message
            message: "Error retrieving shipment tracking details.",
            // Detailed technical error message
            error: error.message
        });
    }
};

/**
 * Controller: Retrieve all shipments with role-aware scoping.
 * Customers receive only their own shipments; Admin/Dispatcher/Drivers receive all or assigned.
 */
export const getAllShipments = async (req, res) => {
    try {
        // Initialize query filter object
        let queryFilter = {};

        // Restrict customers to only view shipments where they are the sender
        if (req.user?.role === "CUSTOMER") {
            // Match sender ObjectId to authenticated user id
            queryFilter.sender = req.user.id;
        } else if (req.user?.role === "DRIVER") {
            // Restrict drivers to shipments assigned to them
            queryFilter.assignedDriver = req.user.id;
        }

        // Query shipments collection applying filter and sorting newest first
        const shipments = await Shipment.find(queryFilter)
            .sort({ createdAt: -1 })
            .populate("sender", "name email")
            .populate("assignedDriver", "name email");

        // Return HTTP 200 OK status code with array of shipments
        return res.status(200).json({
            // Boolean success indicator
            success: true,
            // Total number of matched records
            count: shipments.length,
            // Array of shipment documents
            shipments
        });
    } catch (error) {
        // Output detailed server error to console
        console.error("❌ Error in getAllShipments controller:", error);

        // Return HTTP 500 Internal Server Error response
        return res.status(500).json({
            // Boolean failure indicator
            success: false,
            // Error message
            message: "Failed to retrieve shipments.",
            // Detailed technical error message
            error: error.message
        });
    }
};

/**
 * Controller: Retrieve single shipment by its MongoDB ObjectId.
 */
export const getShipmentById = async (req, res) => {
    try {
        // Extract shipment ID parameter from request URL
        const { id } = req.params;

        // Query shipment by MongoDB ObjectId with populated sender and driver
        const shipment = await Shipment.findById(id)
            .populate("sender", "name email")
            .populate("assignedDriver", "name email");

        // Check if shipment exists
        if (!shipment) {
            // Return HTTP 404 Not Found if record not present
            return res.status(404).json({
                // Boolean failure indicator
                success: false,
                // Error message
                message: "Shipment not found."
            });
        }

        // Return HTTP 200 OK status code with shipment details
        return res.status(200).json({
            // Boolean success indicator
            success: true,
            // Shipment document
            shipment
        });
    } catch (error) {
        // Output detailed server error to console
        console.error("❌ Error in getShipmentById controller:", error);

        // Return HTTP 500 Internal Server Error response
        return res.status(500).json({
            // Boolean failure indicator
            success: false,
            // Error message
            message: "Failed to retrieve shipment details.",
            // Detailed technical error message
            error: error.message
        });
    }
};

// Export all controller functions as a default object bundle
export default {
    createShipment,
    updateShipmentStatus,
    getShipmentByTrackingNumber,
    getAllShipments,
    getShipmentById
};
