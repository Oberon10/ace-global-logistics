// Import the Mongoose library to create schemas and models
import mongoose from "mongoose";

// Import bcryptjs for secure asynchronous password hashing
import bcrypt from "bcryptjs";

// Define the Admin schema specifying structure, constraints, and validation rules strictly for administrators
const adminSchema = new mongoose.Schema(
    {
        // Full legal or corporate name of the administrator
        name: {
            type: String,
            required: [true, "Administrator name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        // Unique administrative email address used as the primary login credential
        email: {
            type: String,
            required: [true, "Admin email address is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
                "Please provide a valid administrative email address"
            ]
        },
        // Hashed password string (bcrypt hashed before persistence)
        password: {
            type: String,
            required: [true, "Admin password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        // Administrative role determining executive privilege level
        role: {
            type: String,
            enum: {
                values: ["ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN", "SECURITY_ADMIN"],
                message: "Role must be either ADMIN, SUPER_ADMIN, SYSTEM_ADMIN, or SECURITY_ADMIN"
            },
            default: "ADMIN"
        },
        // Executive job title
        title: {
            type: String,
            trim: true,
            default: "Executive Vice President of Operations"
        },
        // Security clearance level restricting executive operations
        clearanceLevel: {
            type: String,
            enum: {
                values: ["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "LEVEL_5", "FULL_AUTHORITY"],
                message: "Clearance level must be LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, or FULL_AUTHORITY"
            },
            default: "FULL_AUTHORITY"
        },
        // Hardware or secondary security passkey token required for elevated executive actions
        securityToken: {
            type: String,
            trim: true,
            default: "ACE-SEC-2026"
        },
        // Command division / executive department
        department: {
            type: String,
            trim: true,
            default: "Global Operations Command"
        },
        // Direct administrative contact phone
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        // Granular platform management permissions allocated to this administrator
        permissions: {
            type: [String],
            default: [
                "ALL_PORTALS",
                "MANAGE_USERS",
                "MANAGE_STAFF",
                "MANAGE_SHIPMENTS",
                "SYSTEM_AUDIT",
                "SECURITY_COMMAND",
                "FULL_AUTHORITY"
            ]
        },
        // Operational account status
        status: {
            type: String,
            enum: ["ACTIVE", "SUSPENDED", "DEACTIVATED"],
            default: "ACTIVE"
        },
        // Enforcement of two-factor authentication for executive logins
        twoFactorEnabled: {
            type: Boolean,
            default: true
        },
        // Timestamp of the most recent administrative login session
        lastLogin: {
            type: Date,
            default: Date.now
        },
        // IP address recorded during the last session
        lastLoginIp: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        // Automatically injects createdAt and updatedAt ISO timestamp fields
        timestamps: true
    }
);

// Pre-save hook: automatically hash password using bcrypt if newly set or modified
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    // Prevent double hashing if already bcrypt hashed
    if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Instance method to compare candidate password against hashed password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create or reuse compiled Mongoose Admin model
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

// Export both named and default ES module export
export { Admin };
export default Admin;
