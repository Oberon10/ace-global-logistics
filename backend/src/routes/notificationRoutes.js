import { Router } from "express";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
} from "../controllers/notificationController.js";
import { optionalAuthenticateToken, authenticateToken } from "../middleware/auth.js";

const router = Router();

// Retrieve notifications for authenticated user
router.get("/", optionalAuthenticateToken, getNotifications);

// Mark specific notification as read
router.patch("/:id/read", optionalAuthenticateToken, markNotificationRead);

// Mark all notifications as read
router.patch("/read-all", optionalAuthenticateToken, markAllNotificationsRead);

export default router;
