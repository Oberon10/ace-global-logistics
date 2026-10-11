// Import Mongoose and Notification model
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Staff from "../models/staff.js";

/**
 * Helper utility: Create an in-app notification safely in MongoDB.
 */
export const createNotification = async ({
    recipient = null,
    recipientEmail = "",
    recipientRole = "CUSTOMER",
    shipment = null,
    trackingNumber = "",
    title,
    message,
    type = "STATUS_UPDATE"
}) => {
    try {
        const notif = await Notification.create({
            recipient,
            recipientEmail: (recipientEmail || "").trim().toLowerCase(),
            recipientRole,
            shipment,
            trackingNumber: (trackingNumber || "").trim().toUpperCase(),
            title,
            message,
            type,
            read: false
        });
        return notif;
    } catch (err) {
        console.warn("⚠️ Failed to create notification:", err.message);
        return null;
    }
};

/**
 * Controller: Get notifications for the authenticated user or scoped role.
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user) {
            const userRole = (user.role || "").toUpperCase();
            const userEmail = (user.email || "").toLowerCase();
            const userId = user.id;

            if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
                // Admins see notifications addressed to them, to ADMIN role, or to ALL
                query = {
                    $or: [
                        { recipient: userId },
                        { recipientEmail: userEmail },
                        { recipientRole: "ADMIN" },
                        { recipientRole: "ALL" }
                    ]
                };
            } else if (userRole === "STAFF" || userRole === "DISPATCHER") {
                // Staff see operational dispatch alerts
                query = {
                    $or: [
                        { recipient: userId },
                        { recipientEmail: userEmail },
                        { recipientRole: "STAFF" },
                        { recipientRole: "ALL" }
                    ]
                };
            } else {
                // Customer sees alerts specifically for them
                query = {
                    $or: [
                        { recipient: userId },
                        { recipientEmail: userEmail },
                        { recipientRole: "CUSTOMER", recipientEmail: userEmail }
                    ]
                };
            }
        } else {
            // Unauthenticated fallback: return public system alerts
            query = { recipientRole: "ALL" };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = notifications.filter(n => !n.read).length;

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications.",
            error: error.message
        });
    }
};

/**
 * Controller: Mark a single notification as read.
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notif = await Notification.findByIdAndUpdate(
            id,
            { $set: { read: true, readAt: new Date() } },
            { new: true }
        );

        if (!notif) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            success: true,
            notification: notif
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update notification.",
            error: error.message
        });
    }
};

/**
 * Controller: Mark all notifications as read for current user.
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = async (req, res) => {
    try {
        const user = req.user;
        let query = {};
        if (user) {
            query = {
                $or: [
                    { recipient: user.id },
                    { recipientEmail: (user.email || "").toLowerCase() }
                ]
            };
        }

        await Notification.updateMany(query, {
            $set: { read: true, readAt: new Date() }
        });

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read.",
            error: error.message
        });
    }
};

export default {
    createNotification,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
