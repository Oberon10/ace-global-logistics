// Import the Mongoose library to define schemas, subdocuments, and models
import mongoose from "mongoose";

// List of all supported shipment lifecycle and exception status codes
export const SHIPMENT_STATUSES = [
    // Primary Operational Workflow Lifecycle
    "PENDING",
    "PENDING_INTAKE",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "READY_FOR_DISPATCH",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    // Exception / Hold Stages
    "REJECTED",
    "CANCELLED",
    "ON_HOLD",
    "DELIVERY_FAILED",
    "RETURNED",
    // Legacy compatibility codes
    "ORDER_CREATED",
    "PICKED_UP",
    "EXCEPTION"
];

// Define the subdocument schema for tracking history audit trail entries
const trackingHistorySchema = new mongoose.Schema(
    {
        // Status checkpoint code reached at this specific point in time
        status: {
            type: String,
            required: [true, "Status is required for tracking log"],
            enum: SHIPMENT_STATUSES
        },
        // Previous operational status before this transition
        previousStatus: {
            type: String,
            default: ""
        },
        // Operational action description (e.g. PENDING → IN_TRANSIT)
        action: {
            type: String,
            default: ""
        },
        // Physical location or facility where this status checkpoint occurred
        location: {
            type: String,
            default: ""
        },
        // Human-readable description or notes for the tracking event
        description: {
            type: String,
            default: ""
        },
        // Optional notes or justification explaining this checkpoint
        note: {
            type: String,
            default: ""
        },
        // Role of user who performed the action (CUSTOMER, STAFF, ADMIN, SUPER_ADMIN)
        changedByRole: {
            type: String,
            default: "CUSTOMER"
        },
        // Exact timestamp when this tracking log checkpoint was recorded
        timestamp: {
            type: Date,
            default: Date.now
        },
        // Reference to the user/staff who logged the status update
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        _id: true
    }
);

// Define the primary Shipment schema containing parcel and delivery metadata
const shipmentSchema = new mongoose.Schema(
    {
        // Unique tracking identifier generated upon parcel registration (e.g., ACE-XYZ123)
        trackingNumber: {
            // Data type is a string
            type: String,
            // Mandatory for every shipment
            required: [true, "Tracking number is required"],
            // Enforces uniqueness across all shipments
            unique: true,
            // Ensures tracking number is indexed for high-performance lookup
            index: true,
            // Strips whitespace around tracking number
            trim: true,
            // Automatically converts tracking number to uppercase characters
            uppercase: true
        },
        // Reference to the customer or sender User who initiated the shipment
        sender: {
            // Data type is a MongoDB ObjectId
            type: mongoose.Schema.Types.ObjectId,
            // Relates to the User model
            ref: "User",
            // Sender can be null for guest or operations desk bookings
            default: null
        },
        // Reference to the assigned driver responsible for physical transit and delivery
        assignedDriver: {
            // Data type is a MongoDB ObjectId
            type: mongoose.Schema.Types.ObjectId,
            // Relates to the User model
            ref: "User",
            // Defaults to null until assigned by a dispatcher
            default: null
        },
        // Pickup address and origin location details
        origin: {
            // Full street address of origin pickup point
            address: {
                // Data type is string
                type: String,
                // Origin street address is mandatory
                required: [true, "Origin address is required"],
                // Removes leading/trailing spaces
                trim: true
            },
            // Origin city name
            city: {
                // Data type is string
                type: String,
                // Defaults to empty string
                default: "",
                // Removes leading/trailing spaces
                trim: true
            },
            // Origin state or province
            state: {
                // Data type is string
                type: String,
                // Defaults to empty string
                default: "",
                // Removes leading/trailing spaces
                trim: true
            },
            // Origin country name or ISO country code
            country: {
                // Data type is string
                type: String,
                // Defaults to USA or global default
                default: "USA",
                // Removes leading/trailing spaces
                trim: true
            },
            // Origin postal / zip code
            postalCode: {
                // Data type is string
                type: String,
                // Defaults to empty string
                default: "",
                // Removes leading/trailing spaces
                trim: true
            }
        },
        // Final destination address and drop-off location details
        destination: {
            // Full street address of delivery destination
            address: {
                // Data type is string
                type: String,
                // Destination street address is mandatory
                required: [true, "Destination address is required"],
                // Removes leading/trailing spaces
                trim: true
            },
            // Destination city name
            city: {
                // Data type is string
                type: String,
                // Defaults to empty string
                default: "",
                // Removes leading/trailing spaces
                trim: true
            },
            // Destination state or province
            state: {
                // Data type is string
                type: String,
                // Defaults to empty string
                default: "",
                // Removes leading/trailing spaces
                trim: true
            },
            // Destination country name or ISO country code
            country: {
                // Data type is string
                type: String,
                // Defaults to USA or destination country
                default: "USA",
                // Removes leading/trailing spaces
                trim: true
            },
            // Destination postal / zip code
            postalCode: {
                // Data type is string
                type: String,
                // Defaults to empty string
                default: "",
                // Removes leading/trailing spaces
                trim: true
            }
        },
        // Current operational stage of the shipment in the logistics lifecycle
        currentStatus: {
            type: String,
            enum: {
                values: SHIPMENT_STATUSES,
                message: "{VALUE} is not a valid shipment status"
            },
            // Initial status for customer-created consignments is PENDING
            default: "PENDING",
            index: true
        },
        // Secondary alias field for status mirroring
        shipmentStatus: {
            type: String,
            default: "PENDING"
        },
        // Commercial payment status kept separate from physical operational status
        paymentStatus: {
            type: String,
            enum: {
                values: ["PENDING", "PAID", "REFUNDED", "FAILED"],
                message: "Payment status must be PENDING, PAID, REFUNDED, or FAILED"
            },
            default: "PENDING",
            index: true
        },
        // Reference to assigned operations staff handling verification or terminal dispatch
        assignedStaff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            default: null
        },
        // Creator audit trail
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        createdByRole: {
            type: String,
            enum: ["CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN", "SYSTEM"],
            default: "CUSTOMER"
        },
        // Verification metadata recorded when staff verifies physical package
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            default: null
        },
        verifiedAt: {
            type: Date,
            default: null
        },
        verificationNotes: {
            type: String,
            default: ""
        },
        // Dispatch metadata recorded when staff dispatches shipment into transit
        dispatchedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            default: null
        },
        dispatchedAt: {
            type: Date,
            default: null
        },
        dispatchNotes: {
            type: String,
            default: ""
        },
        // Delivery confirmation metadata recorded when staff confirms delivery
        deliveredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            default: null
        },
        deliveredAt: {
            type: Date,
            default: null
        },
        deliveryNotes: {
            type: String,
            default: ""
        },
        // Cancellation metadata recorded when Admin or Staff cancels shipment
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        cancelledByRole: {
            type: String,
            default: ""
        },
        cancelledByName: {
            type: String,
            default: ""
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        cancellationReason: {
            type: String,
            default: ""
        },
        // Array of chronological tracking history logs updated via $push operations
        trackingHistory: {
            type: [trackingHistorySchema],
            default: []
        },
        // Metadata describing package specifications (weight, dimensions, condition)
        packageDetails: {
            // Customer submitted estimated weight (kg)
            estimatedWeight: {
                type: Number,
                default: 1.0,
                min: [0, "Weight cannot be negative"]
            },
            // Staff verified actual measured weight (kg)
            actualWeight: {
                type: Number,
                default: null,
                min: [0, "Actual weight cannot be negative"]
            },
            // Primary weight value (kept for backward compatibility; reflects actual if verified, else estimated)
            weightKg: {
                type: Number,
                min: [0, "Weight cannot be negative"],
                default: 1.0
            },
            // Customer submitted estimated dimensions string (e.g. "60 × 45 × 40 cm")
            estimatedDimensions: {
                type: String,
                default: ""
            },
            // Staff verified actual dimensions string
            actualDimensions: {
                type: String,
                default: ""
            },
            // Backward compatible dimensions string
            dimensions: {
                type: String,
                default: ""
            },
            // Physical package condition observed during staff verification (e.g. "Good", "Intact", "Damaged")
            condition: {
                type: String,
                default: "Intact / Standard Packaging"
            },
            // Fragile or special handling instructions
            specialHandling: {
                type: String,
                default: ""
            },
            // Staff verification notes specific to package
            verificationNotes: {
                type: String,
                default: ""
            },
            // Category or description of items being shipped
            category: {
                type: String,
                default: "General Freight"
            },
            // Estimated delivery date calculated at booking time
            estimatedDelivery: {
                type: Date,
                default: null
            },
            // Number of pieces/packages
            pieces: {
                type: Number,
                default: 1
            },
            // Declared monetary value
            declaredValue: {
                type: String,
                default: ""
            },
            // Insurance coverage description
            insurance: {
                type: String,
                default: ""
            },
            // Security seal barcode / identifier
            sealNumber: {
                type: String,
                default: ""
            }
        },
        // Customer / company booking display name
        customer: {
            type: String,
            default: ""
        },
        // Shipping method (e.g., Air Freight Priority, Ocean Freight)
        shippingMethod: {
            type: String,
            default: "Air Freight Priority"
        },
        // Sender detailed contact and address info
        senderDetails: {
            name: { type: String, default: "" },
            company: { type: String, default: "" },
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
            address: { type: String, default: "" },
            city: { type: String, default: "" },
            country: { type: String, default: "" }
        },
        // Consignee / Receiver detailed delivery contact info
        receiver: {
            name: { type: String, default: "" },
            company: { type: String, default: "" },
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
            address: { type: String, default: "" },
            city: { type: String, default: "" },
            country: { type: String, default: "" }
        },
        // Financial invoice charges summary
        charges: {
            freight: { type: Number, default: 0 },
            fuelSurcharge: { type: Number, default: 0 },
            customsHandling: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        }
    },
    {
        // Automatically injects createdAt and updatedAt ISO timestamp fields
        timestamps: true
    }
);

// Pre-save hook: ensure shipmentStatus mirrors currentStatus and weightKg/dimensions remain synced
shipmentSchema.pre("save", function (next) {
    if (this.currentStatus) {
        this.shipmentStatus = this.currentStatus;
    }
    if (this.packageDetails) {
        if (this.packageDetails.actualWeight !== null && this.packageDetails.actualWeight !== undefined) {
            this.packageDetails.weightKg = this.packageDetails.actualWeight;
        } else if (this.packageDetails.estimatedWeight) {
            this.packageDetails.weightKg = this.packageDetails.estimatedWeight;
        }
        if (this.packageDetails.actualDimensions) {
            this.packageDetails.dimensions = this.packageDetails.actualDimensions;
        } else if (this.packageDetails.estimatedDimensions) {
            this.packageDetails.dimensions = this.packageDetails.estimatedDimensions;
        }
    }
    next();
});

// Compile the Mongoose model from the schema or reuse existing compiled model
const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);

// Export the Shipment model as the default ES module export
export default Shipment;
