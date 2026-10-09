// Import Mongoose ODM library
import mongoose from "mongoose";

// Import bcryptjs for secure password hashing and verification
import bcrypt from "bcryptjs";

// Import jsonwebtoken for creating and signing authentication tokens
import jwt from "jsonwebtoken";

// Import isolated domain models
import Admin from "../models/admin.js";
import Staff from "../models/staff.js";
import User from "../models/User.js";

/**
 * Seed initial administrative, staff, and customer accounts directly into MongoDB.
 * Strictly separates admin records into the Admin collection, staff records into
 * the Staff collection, and customer records into the User collection.
 */
export const seedDatabaseUsers = async () => {
    try {
        // -------------------------------------------------------------
        // 1. SEED STRICT ADMINISTRATOR ACCOUNTS -> Admin collection
        // -------------------------------------------------------------
        const adminAccounts = [
            {
                name: "Derek Sterling",
                email: "d.sterling@acelogistics.com",
                password: "AdminSecurePass#2026",
                role: "ADMIN",
                title: "Executive Vice President of Operations",
                clearanceLevel: "FULL_AUTHORITY",
                securityToken: "ACE-SEC-2026",
                department: "Global Operations Command",
                phone: "+44 20 7946 0991",
                twoFactorEnabled: true,
                permissions: [
                    "ALL_PORTALS",
                    "MANAGE_USERS",
                    "MANAGE_STAFF",
                    "MANAGE_SHIPMENTS",
                    "SYSTEM_AUDIT",
                    "SECURITY_COMMAND",
                    "FULL_AUTHORITY"
                ],
                status: "ACTIVE"
            }
        ];

        for (const adm of adminAccounts) {
            const exists = await Admin.findOne({ email: adm.email.toLowerCase() });
            if (!exists) {
                await Admin.create({
                    name: adm.name,
                    email: adm.email.toLowerCase(),
                    password: adm.password,
                    role: adm.role,
                    title: adm.title,
                    clearanceLevel: adm.clearanceLevel,
                    securityToken: adm.securityToken,
                    department: adm.department,
                    phone: adm.phone,
                    twoFactorEnabled: adm.twoFactorEnabled,
                    permissions: adm.permissions,
                    status: adm.status
                });
                console.log(`✅ Seeded Executive Administrator: ${adm.email} into Admin collection.`);
            }
        }

        // -------------------------------------------------------------
        // 2. SEED STRICT OPERATIONAL STAFF ACCOUNTS -> Staff collection
        // -------------------------------------------------------------
        const staffAccounts = [
            {
                name: "Sarah O'Connor",
                email: "s.oconnor@acelogistics.com",
                password: "StaffDispatchKey@99",
                role: "STAFF",
                employeeId: "ACE-STF-0199",
                department: "Terminal Dispatch (LHR)",
                station: "Heathrow (LHR)",
                phone: "+44 20 7946 0123",
                shift: "ROTATING",
                dutyStatus: "ON_DUTY",
                accessScope: "Terminal Dispatcher & Customer Console Only",
                permissions: [
                    "DISPATCH_SHIPMENTS",
                    "UPDATE_TRACKING",
                    "SCAN_PACKAGES",
                    "VIEW_TERMINAL_CONSIGNMENTS",
                    "CUSTOMER_SUPPORT"
                ],
                status: "ACTIVE"
            },
            {
                name: "Robert Mensah",
                email: "r.mensah@acelogistics.com",
                password: "KotokaDispatcher#44",
                role: "DISPATCHER",
                employeeId: "ACE-DISP-0044",
                department: "Kotoka Air Terminal Dispatch",
                station: "Kotoka (ACC)",
                phone: "+233 24 412 3456",
                shift: "MORNING",
                dutyStatus: "ON_DUTY",
                accessScope: "Terminal Dispatcher & Customer Console Only",
                permissions: [
                    "DISPATCH_SHIPMENTS",
                    "UPDATE_TRACKING",
                    "SCAN_PACKAGES",
                    "VIEW_TERMINAL_CONSIGNMENTS",
                    "CUSTOMER_SUPPORT"
                ],
                status: "ACTIVE"
            },
            {
                name: "Operations Dispatcher",
                email: "dispatch@acelogistics.com",
                password: "StaffDispatchKey@99",
                role: "STAFF",
                employeeId: "ACE-OPS-0010",
                department: "Global Terminal Operations",
                station: "Global Dispatch",
                phone: "+44 20 7946 0456",
                shift: "ROTATING",
                dutyStatus: "ON_DUTY",
                accessScope: "Terminal Dispatcher & Customer Console Only",
                permissions: [
                    "DISPATCH_SHIPMENTS",
                    "UPDATE_TRACKING",
                    "SCAN_PACKAGES",
                    "VIEW_TERMINAL_CONSIGNMENTS",
                    "CUSTOMER_SUPPORT"
                ],
                status: "ACTIVE"
            }
        ];

        for (const stf of staffAccounts) {
            const exists = await Staff.findOne({ email: stf.email.toLowerCase() });
            if (!exists) {
                await Staff.create({
                    name: stf.name,
                    email: stf.email.toLowerCase(),
                    password: stf.password,
                    role: stf.role,
                    employeeId: stf.employeeId,
                    department: stf.department,
                    station: stf.station,
                    phone: stf.phone,
                    shift: stf.shift,
                    dutyStatus: stf.dutyStatus,
                    accessScope: stf.accessScope,
                    permissions: stf.permissions,
                    status: stf.status
                });
                console.log(`✅ Seeded Operational Staff: ${stf.email} into Staff collection.`);
            }
        }

        // -------------------------------------------------------------
        // 3. SEED STRICT CUSTOMER ACCOUNTS -> User collection
        // -------------------------------------------------------------
        const customerAccounts = [
            {
                name: "Kwame Mensah",
                email: "k.mensah@goldcoasttrading.com",
                password: "KwameTrading#Accra24",
                role: "CUSTOMER",
                company: "Gold Coast Trading Ltd",
                country: "Ghana",
                phone: "+233 55 892 4110",
                items: "Cocoa, Shea Butter & Textiles"
            },
            {
                name: "Jan De Vries",
                email: "j.devries@maersklog.nl",
                password: "MaerskRotterdamPass@82",
                role: "CUSTOMER",
                company: "Maersk Logistics BV",
                country: "Netherlands",
                phone: "+31 10 712 3456",
                items: "Maritime Spares & Commercial Equipment"
            },
            {
                name: "Enterprise Customer",
                email: "customer@example.com",
                password: "CustomerPass#2026",
                role: "CUSTOMER",
                company: "Global Logistics Partners Inc",
                country: "United States",
                phone: "+1 415 555 2671",
                items: "Commercial Freight & Cargo"
            }
        ];

        for (const cust of customerAccounts) {
            const exists = await User.findOne({ email: cust.email.toLowerCase() });
            if (!exists) {
                await User.create({
                    name: cust.name,
                    email: cust.email.toLowerCase(),
                    password: cust.password,
                    role: cust.role,
                    company: cust.company,
                    country: cust.country,
                    phone: cust.phone,
                    items: cust.items || "General Cargo"
                });
                console.log(`✅ Seeded Customer Portal Account: ${cust.email} into User collection.`);
            }
        }

        // -------------------------------------------------------------
        // 4. CLEANUP: Purge any legacy admin or staff entries from User collection
        // -------------------------------------------------------------
        await User.deleteMany({
            email: {
                $in: [
                    "d.sterling@acelogistics.com",
                    "s.oconnor@acelogistics.com",
                    "r.mensah@acelogistics.com",
                    "dispatch@acelogistics.com"
                ]
            }
        });

    } catch (err) {
        console.warn("⚠️ Account seed check notice:", err.message);
    }
};

/**
 * Utility helper function to sign a JWT token with user claims and identity type.
 */
export const generateToken = (user, userType = "USER") => {
    const secret = process.env.JWT_SECRET || "ace_logistics_jwt_super_secret_key_2026_secure_token";
    return jwt.sign(
        {
            id: user._id || user.id,
            role: user.role,
            email: user.email,
            userType
        },
        secret,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );
};

/**
 * Controller: Register a new customer user account in MongoDB.
 * Strictly writes to the User collection.
 */
export const register = async (req, res) => {
    try {
        const { name, email, password, phone, company, country, items } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: name, email, and password."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Cross-collection uniqueness validation: verify email does not exist in Admin, Staff, or User
        const [existingAdmin, existingStaff, existingUser] = await Promise.all([
            Admin.findOne({ email: normalizedEmail }),
            Staff.findOne({ email: normalizedEmail }),
            User.findOne({ email: normalizedEmail })
        ]);

        if (existingAdmin || existingStaff || existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists. Please login instead."
            });
        }

        // Native Mongoose query: Create new customer user
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: password,
            role: "CUSTOMER",
            phone: phone || "",
            company: company || "",
            country: country || "Ghana",
            items: items || ""
        });

        const token = generateToken(newUser, "CUSTOMER");

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            token,
            user: {
                id: newUser._id,
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
                company: newUser.company,
                country: newUser.country,
                items: newUser.items,
                userType: "CUSTOMER",
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error("❌ Error in register controller:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred during registration. Please try again later.",
            error: error.message
        });
    }
};

/**
 * Controller: Authenticate credentials with isolated queries against Admin, Staff, and User models.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password to sign in."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // -------------------------------------------------------------
        // 1. Check Admin model strictly for administrator credentials
        // -------------------------------------------------------------
        const admin = await Admin.findOne({ email: normalizedEmail });
        if (admin) {
            const isMatch = await admin.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password credentials."
                });
            }

            // Update admin login timestamp
            admin.lastLogin = new Date();
            await admin.save();

            const token = generateToken(admin, "ADMIN");

            return res.status(200).json({
                success: true,
                message: "Administrator login successful.",
                token,
                user: {
                    id: admin._id,
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    title: admin.title,
                    clearanceLevel: admin.clearanceLevel,
                    securityToken: admin.securityToken,
                    department: admin.department,
                    phone: admin.phone,
                    permissions: admin.permissions,
                    status: admin.status,
                    twoFactorEnabled: admin.twoFactorEnabled,
                    userType: "ADMIN",
                    createdAt: admin.createdAt
                }
            });
        }

        // -------------------------------------------------------------
        // 2. Check Staff model strictly for staff / dispatcher credentials
        // -------------------------------------------------------------
        const staff = await Staff.findOne({ email: normalizedEmail });
        if (staff) {
            const isMatch = await staff.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password credentials."
                });
            }

            // Update staff login timestamp
            staff.lastLogin = new Date();
            await staff.save();

            const token = generateToken(staff, "STAFF");

            return res.status(200).json({
                success: true,
                message: "Staff login successful.",
                token,
                user: {
                    id: staff._id,
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    employeeId: staff.employeeId,
                    station: staff.station,
                    department: staff.department,
                    shift: staff.shift,
                    dutyStatus: staff.dutyStatus,
                    phone: staff.phone,
                    assignedVehicle: staff.assignedVehicle,
                    licenseNumber: staff.licenseNumber,
                    accessScope: staff.accessScope,
                    permissions: staff.permissions,
                    status: staff.status,
                    userType: "STAFF",
                    createdAt: staff.createdAt
                }
            });
        }

        // -------------------------------------------------------------
        // 3. Check User model strictly for customer / client credentials
        // -------------------------------------------------------------
        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password credentials."
                });
            }

            // Update user login timestamp
            user.lastLogin = new Date();
            await user.save();

            const token = generateToken(user, "CUSTOMER");

            return res.status(200).json({
                success: true,
                message: "Login successful.",
                token,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    company: user.company,
                    country: user.country,
                    items: user.items,
                    status: user.status,
                    userType: "CUSTOMER",
                    createdAt: user.createdAt
                }
            });
        }

        // No matching account found across Admin, Staff, or User
        return res.status(401).json({
            success: false,
            message: "Invalid email or password credentials."
        });
    } catch (error) {
        console.error("❌ Error in login controller:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred during login. Please try again later.",
            error: error.message
        });
    }
};

/**
 * Controller: Retrieve profile data of currently authenticated user using Mongoose.
 * Resolves across Admin, Staff, and User collections by userId.
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing or invalid."
            });
        }

        // Resolve profile across Admin, Staff, or User models (with CastError protection)
        let admin = null;
        let staff = null;
        let user = null;

        if (mongoose.Types.ObjectId.isValid(userId)) {
            admin = await Admin.findById(userId).select("-password");
            if (!admin) staff = await Staff.findById(userId).select("-password");
            if (!admin && !staff) user = await User.findById(userId).select("-password");
        } else {
            // Fallback lookup by verified token email
            const email = req.user?.email ? req.user.email.toLowerCase() : null;
            if (email) {
                admin = await Admin.findOne({ email }).select("-password");
                if (!admin) staff = await Staff.findOne({ email }).select("-password");
                if (!admin && !staff) user = await User.findOne({ email }).select("-password");
            }
        }

        // Return Admin Profile
        if (admin) {
            return res.status(200).json({
                success: true,
                user: {
                    id: admin._id,
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    title: admin.title,
                    clearanceLevel: admin.clearanceLevel,
                    securityToken: admin.securityToken,
                    department: admin.department,
                    phone: admin.phone,
                    permissions: admin.permissions,
                    status: admin.status,
                    twoFactorEnabled: admin.twoFactorEnabled,
                    userType: "ADMIN",
                    createdAt: admin.createdAt
                }
            });
        }

        // Return Staff Profile
        if (staff) {
            return res.status(200).json({
                success: true,
                user: {
                    id: staff._id,
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    employeeId: staff.employeeId,
                    station: staff.station,
                    department: staff.department,
                    shift: staff.shift,
                    dutyStatus: staff.dutyStatus,
                    phone: staff.phone,
                    assignedVehicle: staff.assignedVehicle,
                    licenseNumber: staff.licenseNumber,
                    accessScope: staff.accessScope,
                    permissions: staff.permissions,
                    status: staff.status,
                    userType: "STAFF",
                    createdAt: staff.createdAt
                }
            });
        }

        // Return Customer Profile
        if (user) {
            return res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    company: user.company,
                    country: user.country,
                    items: user.items,
                    status: user.status,
                    userType: "CUSTOMER",
                    createdAt: user.createdAt
                }
            });
        }

        return res.status(404).json({
            success: false,
            message: "User profile not found."
        });
    } catch (error) {
        console.error("❌ Error in getProfile controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile.",
            error: error.message
        });
    }
};

/**
 * Controller: Register an Operational Staff member in MongoDB (Staff collection).
 */
export const createStaff = async (req, res) => {
    try {
        const { name, email, password, role, department, station, phone, shift, dutyStatus, accessScope, permissions } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Staff name, email, and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Cross-collection uniqueness validation
        const [existingAdmin, existingStaff, existingUser] = await Promise.all([
            Admin.findOne({ email: normalizedEmail }),
            Staff.findOne({ email: normalizedEmail }),
            User.findOne({ email: normalizedEmail })
        ]);

        if (existingAdmin || existingStaff || existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists."
            });
        }

        const newStaff = await Staff.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: (role || "STAFF").toUpperCase(),
            employeeId: `ACE-STF-${Math.floor(1000 + Math.random() * 9000)}`,
            department: department || "Operations Dispatch",
            station: station || "Terminal Hub",
            phone: phone || "",
            shift: (shift && ["MORNING", "AFTERNOON", "NIGHT", "ROTATING", "ON_CALL"].includes(shift.toUpperCase())) ? shift.toUpperCase() : "ROTATING",
            dutyStatus: (dutyStatus && ["ON_DUTY", "OFF_DUTY", "ON_BREAK", "DISPATCHED", "STANDBY"].includes(dutyStatus.toUpperCase())) ? dutyStatus.toUpperCase() : "ON_DUTY",
            accessScope: accessScope || "Terminal Dispatcher & Customer Console Only",
            permissions: permissions || ["DISPATCH_SHIPMENTS", "UPDATE_TRACKING", "VIEW_TERMINAL_CONSIGNMENTS"],
            status: "ACTIVE"
        });

        return res.status(201).json({
            success: true,
            message: "Operational Staff account created successfully in MongoDB.",
            staff: {
                id: newStaff._id,
                _id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                role: "Staff",
                department: newStaff.department,
                phone: newStaff.phone,
                status: "Active",
                accessScope: newStaff.accessScope,
                createdAt: newStaff.createdAt
            }
        });
    } catch (error) {
        console.error("❌ Error in createStaff controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create staff member in database.",
            error: error.message
        });
    }
};

/**
 * Controller: Register a System Administrator in MongoDB (Admin collection).
 */
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password, title, clearanceLevel, department, phone, permissions } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Admin name, email, and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Cross-collection uniqueness validation
        const [existingAdmin, existingStaff, existingUser] = await Promise.all([
            Admin.findOne({ email: normalizedEmail }),
            Staff.findOne({ email: normalizedEmail }),
            User.findOne({ email: normalizedEmail })
        ]);

        if (existingAdmin || existingStaff || existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists."
            });
        }

        const newAdmin = await Admin.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: "ADMIN",
            title: title || "Systems Administrator",
            clearanceLevel: clearanceLevel || "FULL_AUTHORITY",
            securityToken: `ACE-SEC-${Math.floor(1000 + Math.random() * 9000)}`,
            department: department || "Operations Command",
            phone: phone || "",
            permissions: permissions || ["ALL_PORTALS", "MANAGE_USERS", "MANAGE_STAFF", "MANAGE_SHIPMENTS", "FULL_AUTHORITY"],
            status: "ACTIVE"
        });

        return res.status(201).json({
            success: true,
            message: "Administrator account created successfully in MongoDB.",
            admin: {
                id: newAdmin._id,
                _id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: "Admin",
                department: newAdmin.department,
                phone: newAdmin.phone,
                status: "Active",
                accessScope: "Full All-Portals Executive Authority",
                createdAt: newAdmin.createdAt
            }
        });
    } catch (error) {
        console.error("❌ Error in createAdmin controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create administrator in database.",
            error: error.message
        });
    }
};

/**
 * Controller: Fetch all users across Admin, Staff, and User collections.
 */
export const getAllUsers = async (req, res) => {
    try {
        const [admins, staffMembers, customers] = await Promise.all([
            Admin.find({}).sort({ createdAt: -1 }),
            Staff.find({}).sort({ createdAt: -1 }),
            User.find({}).sort({ createdAt: -1 })
        ]);

        const mappedAdmins = admins.map(a => ({
            id: String(a._id),
            _id: a._id,
            name: a.name,
            email: a.email,
            role: "Admin",
            department: a.department || "Global Operations Command",
            phone: a.phone || "",
            status: a.status === "ACTIVE" ? "Active" : "Inactive",
            accessScope: "Full All-Portals Executive Authority",
            lastLogin: a.lastLogin ? new Date(a.lastLogin).toLocaleDateString() : "Active",
            createdAt: a.createdAt
        }));

        const mappedStaff = staffMembers.map(s => ({
            id: String(s._id),
            _id: s._id,
            name: s.name,
            email: s.email,
            role: "Staff",
            department: s.department || "Operations Dispatch",
            phone: s.phone || "",
            status: s.status === "ACTIVE" ? "Active" : "Inactive",
            accessScope: s.accessScope || "Terminal Dispatcher & Customer Console Only",
            lastLogin: s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : "Active",
            createdAt: s.createdAt
        }));

        const mappedCustomers = customers.map(c => ({
            id: String(c._id),
            _id: c._id,
            name: c.name,
            email: c.email,
            role: "Customer",
            department: c.company || "Commercial Freight",
            phone: c.phone || "",
            status: c.status === "ACTIVE" ? "Active" : "Inactive",
            accessScope: "Personal Shipments & Telemetry Records Only",
            lastLogin: c.lastLogin ? new Date(c.lastLogin).toLocaleDateString() : "Active",
            createdAt: c.createdAt
        }));

        const combinedUsers = [...mappedAdmins, ...mappedStaff, ...mappedCustomers];

        return res.status(200).json({
            success: true,
            count: combinedUsers.length,
            users: combinedUsers
        });
    } catch (error) {
        console.error("❌ Error in getAllUsers controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users from database.",
            error: error.message
        });
    }
};

/**
 * Controller: Update user/staff/admin status or details.
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, name, phone, department } = req.body;

        const updatePayload = {};
        if (status) updatePayload.status = status.toUpperCase();
        if (name) updatePayload.name = name;
        if (phone) updatePayload.phone = phone;
        if (department) updatePayload.department = department;

        let updated = await User.findByIdAndUpdate(id, updatePayload, { new: true });
        if (!updated) {
            updated = await Staff.findByIdAndUpdate(id, updatePayload, { new: true });
        }
        if (!updated) {
            updated = await Admin.findByIdAndUpdate(id, updatePayload, { new: true });
        }

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "User record not found in database."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            user: updated
        });
    } catch (error) {
        console.error("❌ Error in updateUser controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user in database.",
            error: error.message
        });
    }
};

/**
 * Controller: Delete user/staff/admin by ID.
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        let deleted = await User.findByIdAndDelete(id);
        if (!deleted) {
            deleted = await Staff.findByIdAndDelete(id);
        }
        if (!deleted) {
            deleted = await Admin.findByIdAndDelete(id);
        }

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "User record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully from database."
        });
    } catch (error) {
        console.error("❌ Error in deleteUser controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user.",
            error: error.message
        });
    }
};

export default {
    register,
    login,
    getProfile,
    seedDatabaseUsers,
    createStaff,
    createAdmin,
    getAllUsers,
    updateUser,
    deleteUser
};
