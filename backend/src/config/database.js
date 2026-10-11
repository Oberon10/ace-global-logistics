
import dns from "dns";
import mongoose from "mongoose";

// Configure robust public DNS resolvers (Google & Cloudflare) to ensure MongoDB Atlas
// SRV records (_mongodb._tcp...) resolve reliably across Windows networks and local ISP routers
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
    console.warn("⚠️ Custom DNS resolver initialization note:", dnsErr.message);
}

export const isDatabaseConnected = () => {
    return mongoose.connection.readyState === 1;
};

let connectionPromise = null;

const connectDB = async () => {
    // Reuse an existing database connection.
    if (isDatabaseConnected()) {
        return mongoose.connection;
    }

    // Prevent simultaneous connection attempts.
    if (connectionPromise) {
        return connectionPromise;
    }

    const primaryUri = process.env.MONGODB_URI;

    // Ensure the connection string exists.
    if (!primaryUri) {
        throw new Error(
            "MONGODB_URI is missing from the backend .env file."
        );
    }

    // Ensure this application uses MongoDB Atlas.
    if (!primaryUri.startsWith("mongodb+srv://")) {
        throw new Error(
            "MONGODB_URI must contain your MongoDB Atlas connection string (mongodb+srv://)."
        );
    }

    connectionPromise = (async () => {
        try {
            await mongoose.connect(primaryUri, {
                dbName: "ace_logistics",
                serverSelectionTimeoutMS: 10000
            });

            console.log("✅ MongoDB Atlas connected successfully!");
            console.log("Host:", mongoose.connection.host);
            console.log("Database:", mongoose.connection.name);

            return mongoose.connection;
        } catch (error) {
            console.error(
                "❌ MongoDB Atlas connection failed:",
                error.message
            );

            if (error.message.includes("whitelist") || error.message.includes("alert internal error") || error.message.includes("ReplicaSetNoPrimary") || error.message.includes("network socket disconnected")) {
                console.error("💡 Action Required: Please ensure your current IP address (or 0.0.0.0/0) is added to your MongoDB Atlas Network Access whitelist at cloud.mongodb.com -> Network Access.");
            }

            throw error;
        } finally {
            connectionPromise = null;
        }
    })();

    return connectionPromise;
};

export default connectDB;