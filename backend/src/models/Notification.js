// Import the Mongoose library
import mongoose from "mongoose";

// Define schema for in-app notifications
const notificationSchema = new mongoose.Schema(
    {
        // Reference to recipient user (customer, staff, or admin)
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        // Direct email lookup for guest or multi-role indexing
        recipientEmail: {
            type: String,
            default: "",
            lowercase: true,
            trim: true,
            index: true
        },
        // Role audience (CUSTOMER, STAFF, ADMIN, ALL)
        recipientRole: {
            type: String,
            enum: ["CUSTOMER", "STAFF", "ADMIN", "ALL"],
            default: "CUSTOMER",
            index: true
        },
        // Associated shipment if applicable
        shipment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shipment",
            default: null
        },
        // Associated tracking number
        trackingNumber: {
            type: String,
            default: "",
            trim: true,
            uppercase: true,
            index: true
        },
        // Notification headline
        title: {
            type: String,
            required: [true, "Notification title is required"],
            trim: true
        },
        // Notification descriptive message
        message: {
            type: String,
            required: [true, "Notification message is required"],
            trim: true
        },
        // Category of notification
        type: {
            type: String,
            enum: [
                "REQUEST_CREATED",
                "VERIFICATION",
                "STATUS_UPDATE",
                "DISPATCH",
                "DELIVERY",
                "EXCEPTION",
                "SYSTEM"
            ],
            default: "STATUS_UPDATE"
        },
        // Read status indicator
        read: {
            type: Boolean,
            default: false,
            index: true
        },
        // Timestamp when marked as read
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Compile or reuse compiled model
const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
