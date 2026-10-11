import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";

dotenv.config();

const BASE_URL = "http://localhost:5000";

async function runTests() {
    console.log("=================================================");
    console.log("🧪 STARTING MONGODB ATLAS PERSISTENCE TEST SUITE");
    console.log("=================================================");

    const timestamp = Date.now();
    const testCustomerEmail = `test.customer.${timestamp}@example.com`;
    const testStaffEmail = `test.staff.${timestamp}@example.com`;
    const testAdminEmail = `test.admin.${timestamp}@example.com`;

    // 1. Health check & DB connection
    console.log("\n[Test 1] Checking API health and MongoDB Atlas connection...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log("Health Status:", healthData);
    if (!healthRes.ok || healthData.status !== "UP") {
        throw new Error("Health check failed!");
    }
    console.log("✅ Health check passed!");

    // 2. Create Test Customer
    console.log("\n[Test 2] Creating test customer user...");
    const custRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: `Test Customer ${timestamp}`,
            email: testCustomerEmail,
            password: "CustomerSecure#2026",
            role: "CUSTOMER",
            phone: "+1 555 123 4567",
            company: "Test Logistics Corp",
            country: "USA",
            items: "Electronics"
        })
    });
    const custData = await custRes.json();
    console.log("Customer response:", custData);
    if (!custRes.ok || !custData.success || !custData.user?._id) {
        throw new Error(`Failed to create customer: ${JSON.stringify(custData)}`);
    }
    const customerId = custData.user._id;
    console.log(`✅ Customer successfully created with ID: ${customerId}`);

    // 3. Create Test Staff
    console.log("\n[Test 3] Creating test staff user...");
    const staffRes = await fetch(`${BASE_URL}/api/auth/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: `Test Staff ${timestamp}`,
            email: testStaffEmail,
            password: "StaffSecure#2026",
            role: "STAFF",
            department: "Terminal Dispatch (LHR)",
            phone: "+44 20 7946 0999"
        })
    });
    const staffData = await staffRes.json();
    console.log("Staff response:", staffData);
    if (!staffRes.ok || !staffData.success || !staffData.staff?._id) {
        throw new Error(`Failed to create staff: ${JSON.stringify(staffData)}`);
    }
    const staffId = staffData.staff._id;
    console.log(`✅ Staff successfully created with ID: ${staffId}`);

    // 4. Create Test Admin
    console.log("\n[Test 4] Creating test admin user...");
    const adminRes = await fetch(`${BASE_URL}/api/auth/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: `Test Admin ${timestamp}`,
            email: testAdminEmail,
            password: "AdminSecure#2026",
            role: "ADMIN",
            department: "Global Operations Command",
            phone: "+44 20 7946 0888"
        })
    });
    const adminData = await adminRes.json();
    console.log("Admin response:", adminData);
    if (!adminRes.ok || !adminData.success || !adminData.admin?._id) {
        throw new Error(`Failed to create admin: ${JSON.stringify(adminData)}`);
    }
    const adminId = adminData.admin._id;
    console.log(`✅ Admin successfully created with ID: ${adminId}`);

    // 5. Test Duplicate Email Prevention
    console.log("\n[Test 5] Verifying duplicate email rejection...");
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Duplicate Tester",
            email: testCustomerEmail,
            password: "SomePassword123"
        })
    });
    const dupData = await dupRes.json();
    console.log("Duplicate check response (status):", dupRes.status, dupData.message);
    if (dupRes.status !== 409) {
        throw new Error(`Expected 409 Conflict for duplicate email, got ${dupRes.status}`);
    }
    console.log("✅ Duplicate prevention verified!");

    // 6. Test Authentication from MongoDB
    console.log("\n[Test 6] Testing login authentication from MongoDB Atlas...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: testCustomerEmail,
            password: "CustomerSecure#2026"
        })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) {
        throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const customerToken = loginData.token;
    console.log("✅ Customer logged in from MongoDB! JWT Token received.");

    // 7. Create Multiple Shipments
    console.log("\n[Test 7] Creating multiple shipments independently in MongoDB Atlas...");
    const shipment1Res = await fetch(`${BASE_URL}/api/shipments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        },
        body: JSON.stringify({
            origin: "Accra, Ghana",
            destination: "London, UK",
            status: "IN_TRANSIT",
            method: "Air Freight Priority",
            customer: `Test Logistics Corp`,
            sender: {
                name: `Test Customer ${timestamp}`,
                email: testCustomerEmail,
                city: "Accra",
                country: "Ghana"
            },
            receiver: {
                name: "Receiver Alpha",
                email: "alpha@recipient.co.uk",
                city: "London",
                country: "UK"
            },
            packageDetails: {
                weightKg: 25.5,
                category: "Priority Cargo",
                dimensions: "50x40x30 cm"
            },
            charges: {
                freight: 450,
                total: 520
            }
        })
    });
    const shipment1Data = await shipment1Res.json();
    if (!shipment1Res.ok || !shipment1Data.success || !shipment1Data.shipment?.trackingNumber) {
        throw new Error(`Failed to create shipment 1: ${JSON.stringify(shipment1Data)}`);
    }
    const tracking1 = shipment1Data.shipment.trackingNumber;
    const shipmentId1 = shipment1Data.shipment._id;
    console.log(`✅ Shipment 1 created with Tracking: ${tracking1}, MongoDB ID: ${shipmentId1}`);

    const shipment2Res = await fetch(`${BASE_URL}/api/shipments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        },
        body: JSON.stringify({
            origin: "Rotterdam, Netherlands",
            destination: "New York, USA",
            status: "ORDER_CREATED",
            method: "Ocean Freight",
            customer: `Test Logistics Corp`,
            sender: {
                name: `Test Customer ${timestamp}`,
                email: testCustomerEmail,
                city: "Rotterdam",
                country: "Netherlands"
            },
            receiver: {
                name: "Receiver Beta",
                email: "beta@recipient.com",
                city: "New York",
                country: "USA"
            },
            packageDetails: {
                weightKg: 120.0,
                category: "Heavy Freight",
                dimensions: "120x80x100 cm"
            },
            charges: {
                freight: 1200,
                total: 1350
            }
        })
    });
    const shipment2Data = await shipment2Res.json();
    if (!shipment2Res.ok || !shipment2Data.success || !shipment2Data.shipment?.trackingNumber) {
        throw new Error(`Failed to create shipment 2: ${JSON.stringify(shipment2Data)}`);
    }
    const tracking2 = shipment2Data.shipment.trackingNumber;
    const shipmentId2 = shipment2Data.shipment._id;
    console.log(`✅ Shipment 2 created with Tracking: ${tracking2}, MongoDB ID: ${shipmentId2}`);

    // Verify shipments are independent
    if (tracking1 === tracking2 || shipmentId1 === shipmentId2) {
        throw new Error("Shipments overwrote each other or generated duplicate tracking numbers!");
    }
    console.log("✅ Verified shipments stored independently with unique tracking numbers!");

    // 8. Track Shipment from MongoDB Atlas
    console.log(`\n[Test 8] Tracking shipment '${tracking1}' directly from MongoDB Atlas...`);
    const trackRes = await fetch(`${BASE_URL}/api/shipments/track/${tracking1}`);
    const trackData = await trackRes.json();
    if (!trackRes.ok || !trackData.success || trackData.shipment?.trackingNumber !== tracking1) {
        throw new Error(`Tracking lookup failed: ${JSON.stringify(trackData)}`);
    }
    console.log("Tracking Result from MongoDB:", {
        trackingNumber: trackData.shipment.trackingNumber,
        status: trackData.shipment.currentStatus,
        origin: trackData.shipment.origin?.city,
        destination: trackData.shipment.destination?.city,
        receiver: trackData.shipment.receiver?.name
    });
    console.log("✅ Tracking from MongoDB Atlas verified!");

    // 9. Update Shipment Status in MongoDB Atlas
    console.log(`\n[Test 9] Updating shipment status for '${tracking1}' to 'OUT_FOR_DELIVERY'...`);
    const updateRes = await fetch(`${BASE_URL}/api/shipments/${tracking1}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status: "OUT_FOR_DELIVERY",
            location: "Heathrow Final Mile Depot",
            description: "Loaded onto delivery van for recipient drop-off."
        })
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok || !updateData.success || updateData.shipment?.currentStatus !== "OUT_FOR_DELIVERY") {
        throw new Error(`Status update failed: ${JSON.stringify(updateData)}`);
    }
    console.log("✅ Updated status in MongoDB:", updateData.shipment.currentStatus);

    // 10. Direct MongoDB Atlas verification using Mongoose
    console.log("\n[Test 10] Directly inspecting MongoDB Atlas database to confirm document persistence...");
    await connectDB();
    const db = mongoose.connection.db;

    const atlasCustomer = await db.collection("users").findOne({ email: testCustomerEmail });
    const atlasStaff = await db.collection("staffs").findOne({ email: testStaffEmail });
    const atlasAdmin = await db.collection("admins").findOne({ email: testAdminEmail });
    const atlasShipment1 = await db.collection("shipments").findOne({ trackingNumber: tracking1 });
    const atlasShipment2 = await db.collection("shipments").findOne({ trackingNumber: tracking2 });

    console.log("MongoDB Atlas Direct Document Checks:");
    console.log("- User doc found:", !!atlasCustomer, "| Email:", atlasCustomer?.email);
    console.log("- Staff doc found:", !!atlasStaff, "| Email:", atlasStaff?.email);
    console.log("- Admin doc found:", !!atlasAdmin, "| Email:", atlasAdmin?.email);
    console.log("- Shipment 1 found:", !!atlasShipment1, "| Status:", atlasShipment1?.currentStatus);
    console.log("- Shipment 2 found:", !!atlasShipment2, "| Status:", atlasShipment2?.currentStatus);

    if (!atlasCustomer || !atlasStaff || !atlasAdmin || !atlasShipment1 || !atlasShipment2) {
        throw new Error("One or more documents missing directly from MongoDB Atlas!");
    }
    console.log("✅ Direct MongoDB Atlas verification confirmed for all collections!");

    // 11. Clean up test records
    console.log("\n[Test 11] Cleaning up test records from MongoDB Atlas...");
    await db.collection("users").deleteOne({ email: testCustomerEmail });
    await db.collection("staffs").deleteOne({ email: testStaffEmail });
    await db.collection("admins").deleteOne({ email: testAdminEmail });
    await db.collection("shipments").deleteOne({ trackingNumber: tracking1 });
    await db.collection("shipments").deleteOne({ trackingNumber: tracking2 });
    await mongoose.disconnect();
    console.log("✅ Test records cleaned up successfully.");

    console.log("\n=================================================");
    console.log("🎉 ALL DATABASE PERSISTENCE TESTS PASSED 100%!");
    console.log("=================================================");
}

runTests().catch(err => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
});
