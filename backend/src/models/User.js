import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the User schema specifying structure, types, constraints, and validation rules
const userSchema = new mongoose.Schema(
    {
        // Full name of the user
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        // Unique email address used as the primary login credential
        email: {
            type: String,
            required: [true, "Email address is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
                "Please provide a valid email address"
            ]
        },
        // Hashed password string (bcrypt hashed)
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        // Role of the user determining customer/client portal access
        role: {
            type: String,
            enum: {
                values: ["CUSTOMER", "CLIENT", "USER"],
                message: "Role must be either CUSTOMER, CLIENT, or USER"
            },
            default: "CUSTOMER"
        },
        // User metadata
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        company: {
            type: String,
            trim: true,
            default: ""
        },
        country: {
            type: String,
            trim: true,
            default: "Ghana"
        },
        items: {
            type: String,
            trim: true,
            default: ""
        },
        station: {
            type: String,
            trim: true,
            default: ""
        },
        department: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE"
        },
        lastLogin: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Pre-save hook: automatically hash password using bcrypt if newly set or modified
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    // Prevent double hashing if already bcrypt hashed
    if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Instance method to compare candidate password against hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create or reuse compiled Mongoose User model
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Export both named and default ES module export
export { User };
export default User;
