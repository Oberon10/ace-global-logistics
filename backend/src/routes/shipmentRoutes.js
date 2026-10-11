// Import Router from Express to declare modular shipment route definitions
import { Router } from "express";

// Import shipment controller functions handling business logic
import {
    createShipment,
    verifyShipment,
    updateShipmentStatus,
    getShipmentByTrackingNumber,
    getAllShipments,
    getShipmentById,
    getShipmentStats,
    deleteShipment
} from "../controllers/shipmentController.js";

// Import authentication and authorization middleware functions
import { authenticateToken, optionalAuthenticateToken } from "../middleware/auth.js";

// Instantiate a new Express router for shipment operations
const router = Router();

/**
 * @route   GET /api/shipments/track/:trackingNumber
 * @desc    Public tracking endpoint to lookup shipment progress by tracking number
 * @access  Public (No authentication token required)
 */
router.get(
    "/track/:trackingNumber",
    getShipmentByTrackingNumber
);

/**
 * @route   GET /api/shipments/stats/admin
 * @desc    Retrieve real operational statistics from MongoDB (Users, Shipments, Revenue)
 * @access  Authenticated / Public fallback
 */
router.get(
    "/stats/admin",
    optionalAuthenticateToken,
    getShipmentStats
);

/**
 * @route   POST /api/shipments
 * @desc    Create a new shipment booking (customer request or staff booking)
 * @access  Public / Authenticated
 */
router.post(
    "/",
    optionalAuthenticateToken,
    createShipment
);

/**
 * @route   PATCH /api/shipments/:id/verify
 * @desc    Staff verifies physical package, records actual measurements and condition
 * @access  Authenticated (Staff / Admin)
 */
router.patch(
    "/:id/verify",
    optionalAuthenticateToken,
    verifyShipment
);

/**
 * @route   PATCH /api/shipments/:id/status
 * @desc    Update current operational status adhering to lifecycle transition rules
 * @access  Authenticated (Staff / Admin)
 */
router.patch(
    "/:id/status",
    optionalAuthenticateToken,
    updateShipmentStatus
);

/**
 * @route   GET /api/shipments
 * @desc    Retrieve shipment list (scoped to user's shipments or full list for ops)
 * @access  Public / Authenticated
 */
router.get(
    "/",
    optionalAuthenticateToken,
    getAllShipments
);

/**
 * @route   GET /api/shipments/:id
 * @desc    Retrieve detailed shipment record by MongoDB ObjectId or trackingNumber
 * @access  Public / Authenticated (Enforces customer data ownership)
 */
router.get(
    "/:id",
    optionalAuthenticateToken,
    getShipmentById
);

/**
 * @route   DELETE /api/shipments/:id
 * @desc    Delete a shipment record by MongoDB ObjectId or trackingNumber
 * @access  Authenticated (Admin only)
 */
router.delete(
    "/:id",
    optionalAuthenticateToken,
    deleteShipment
);

// Export router instance as the default ES module export
export default router;
