// Import the Mongoose library to create schemas and models
import mongoose from "mongoose";

// Import bcryptjs for secure asynchronous password hashing
import bcrypt from "bcryptjs";

// Define the Staff schema specifying structure, constraints, and validation rules strictly for operational staff
const staffSchema = new mongoose.Schema(
    {
        // Full legal name of the staff member / dispatcher
        name: {
            type: String,
            required: [true, "Staff member name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        // Unique operational email address used as the primary login credential
        email: {
            type: String,
            required: [true, "Staff email address is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
                "Please provide a valid staff email address"
            ]
        },
        // Hashed password string (bcrypt hashed before persistence)
        password: {
            type: String,
            required: [true, "Staff password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        // Unique operational employee ID / badge number
        employeeId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        // Operational staff role determining console and dispatch privilege level
        role: {
            type: String,
            enum: {
                values: [
                    "STAFF",
                    "DISPATCHER",
                    "OPERATOR",
                    "WAREHOUSE_OPERATOR",
                    "CUSTOMS_OFFICER",
                    "TERMINAL_DISPATCHER",
                    "DRIVER"
                ],
                message: "Role must be a valid staff or operations role (STAFF, DISPATCHER, OPERATOR, WAREHOUSE_OPERATOR, CUSTOMS_OFFICER, TERMINAL_DISPATCHER, or DRIVER)"
            },
            default: "STAFF"
        },
        // Assigned physical logistics terminal, airport ramp, or distribution hub
        station: {
            type: String,
            required: [true, "Assigned station or terminal is required"],
            trim: true,
            default: "Global Dispatch"
        },
        // Operational department / division within the terminal or hub
        department: {
            type: String,
            trim: true,
            default: "Terminal Operations"
        },
        // Scheduled duty roster shift
        shift: {
            type: String,
            enum: {
                values: ["MORNING", "AFTERNOON", "NIGHT", "ROTATING", "ON_CALL"],
                message: "Shift must be MORNING, AFTERNOON, NIGHT, ROTATING, or ON_CALL"
            },
            default: "ROTATING"
        },
        // Real-time duty readiness status for live consignment assignment
        dutyStatus: {
            type: String,
            enum: {
                values: ["ON_DUTY", "OFF_DUTY", "ON_BREAK", "DISPATCHED", "STANDBY"],
                message: "Duty status must be ON_DUTY, OFF_DUTY, ON_BREAK, DISPATCHED, or STANDBY"
            },
            default: "ON_DUTY"
        },
        // Direct operational desk phone or radio contact number
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        // Vehicle or fleet unit identifier assigned to driver/ramp staff
        assignedVehicle: {
            type: String,
            trim: true,
            default: ""
        },
        // Commercial driver, ramp safety, or equipment operating license ID
        licenseNumber: {
            type: String,
            trim: true,
            default: ""
        },
        // System access boundary description for audit compliance
        accessScope: {
            type: String,
            trim: true,
            default: "Terminal Dispatcher & Customer Console Only"
        },
        // Operational permissions allocated specifically to staff duties
        permissions: {
            type: [String],
            default: [
                "DISPATCH_SHIPMENTS",
                "UPDATE_TRACKING",
                "SCAN_PACKAGES",
                "VIEW_TERMINAL_CONSIGNMENTS",
                "CUSTOMER_SUPPORT"
            ]
        },
        // Operational account status
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE"
        },
        // Timestamp of the most recent operational session
        lastLogin: {
            type: Date,
            default: Date.now
        }
    },
    {
        // Automatically injects createdAt and updatedAt ISO timestamp fields
        timestamps: true
    }
);

// Pre-save hook: automatically hash password using bcrypt if newly set or modified
staffSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    // Prevent double hashing if already bcrypt hashed
    if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Instance method to compare candidate password against hashed password
staffSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create or reuse compiled Mongoose Staff model
const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);

// Export both named and default ES module export
export { Staff };
export default Staff;
