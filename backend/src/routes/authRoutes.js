// Import the Router module from Express to define modular route endpoints
import { Router } from "express";

// Import authentication controller handler functions
import { 
    register, 
    login, 
    getProfile, 
    createStaff, 
    createAdmin, 
    getAllUsers, 
    updateUser, 
    deleteUser 
} from "../controllers/authController.js";

// Import JWT authentication middleware to protect sensitive profile routes
import { authenticateToken } from "../middleware/auth.js";

// Initialize a new Express router instance for authentication routing
const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer, driver, dispatcher, or admin user
 * @access  Public
 */
router.post(
    "/register",
    register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials (email & password) and return JWT
 * @access  Public
 */
router.post(
    "/login",
    login
);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve profile data of currently authenticated user
 * @access  Private (Requires valid JWT Bearer token)
 */
router.get(
    "/me",
    authenticateToken,
    getProfile
);

/**
 * @route   POST /api/auth/staff
 * @desc    Create a new operational staff account in MongoDB (Staff collection)
 * @access  Public / Admin
 */
router.post(
    "/staff",
    createStaff
);

/**
 * @route   POST /api/auth/admin
 * @desc    Create a new administrator account in MongoDB (Admin collection)
 * @access  Public / Admin
 */
router.post(
    "/admin",
    createAdmin
);

/**
 * @route   GET /api/auth/users
 * @desc    Retrieve all users across Admin, Staff, and User collections
 * @access  Public / Admin
 */
router.get(
    "/users",
    getAllUsers
);

/**
 * @route   PATCH /api/auth/users/:id
 * @desc    Update user or staff or admin details/status in MongoDB
 * @access  Public / Admin
 */
router.patch(
    "/users/:id",
    updateUser
);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user or staff or admin from MongoDB
 * @access  Public / Admin
 */
router.delete(
    "/users/:id",
    deleteUser
);

// Export router instance as the default ES module export
export default router;

