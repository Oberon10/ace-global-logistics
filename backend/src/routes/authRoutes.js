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
    deleteUser,
    resetPassword
} from "../controllers/authController.js";

// Import JWT authentication middleware to protect sensitive profile routes
import { authenticateToken, optionalAuthenticateToken } from "../middleware/auth.js";

// Initialize a new Express router instance for authentication routing
const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer user (strictly customer role)
 * @access  Public
 */
router.post(
    "/register",
    register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials (email & password & portal) and return JWT
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
 * @access  Admin Only / Initial setup
 */
router.post(
    "/staff",
    optionalAuthenticateToken,
    createStaff
);

/**
 * @route   POST /api/auth/admin
 * @desc    Create a new administrator account in MongoDB (Admin collection)
 * @access  Admin Only / Initial setup
 */
router.post(
    "/admin",
    optionalAuthenticateToken,
    createAdmin
);

/**
 * @route   GET /api/auth/users
 * @desc    Retrieve all users across Admin, Staff, and User collections
 * @access  Admin / Authenticated
 */
router.get(
    "/users",
    optionalAuthenticateToken,
    getAllUsers
);

/**
 * @route   PATCH /api/auth/users/:id
 * @desc    Update user or staff or admin details/status in MongoDB
 * @access  Admin / Authenticated
 */
router.patch(
    "/users/:id",
    optionalAuthenticateToken,
    updateUser
);

/**
 * @route   POST /api/auth/users/:id/reset-password
 * @desc    Securely reset a user password (hashed with bcrypt)
 * @access  Admin Only
 */
router.post(
    "/users/:id/reset-password",
    optionalAuthenticateToken,
    resetPassword
);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user or staff or admin from MongoDB
 * @access  Admin Only
 */
router.delete(
    "/users/:id",
    optionalAuthenticateToken,
    deleteUser
);

// Export router instance as the default ES module export
export default router;

