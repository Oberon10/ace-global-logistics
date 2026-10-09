// Import Router from Express to declare modular shipment route definitions
import { Router } from "express";

// Import shipment controller functions handling business logic
import {
    createShipment,
    updateShipmentStatus,
    getShipmentByTrackingNumber,
    getAllShipments,
    getShipmentById
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
 * @route   POST /api/shipments
 * @desc    Create a new shipment booking with auto-generated tracking code
 * @access  Public / Authenticated
 */
router.post(
    "/",
    optionalAuthenticateToken,
    createShipment
);

/**
 * @route   PATCH /api/shipments/:id/status
 * @desc    Update current operational status and push new tracking checkpoint log
 * @access  Public / Authenticated
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
 * @desc    Retrieve detailed shipment record by MongoDB ObjectId
 * @access  Public / Authenticated
 */
router.get(
    "/:id",
    optionalAuthenticateToken,
    getShipmentById
);


// Export router instance as the default ES module export
export default router;
