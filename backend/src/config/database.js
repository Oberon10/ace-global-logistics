// Import the Mongoose ODM library to interact with MongoDB
import mongoose from "mongoose";

/**
 * Check if the MongoDB connection is currently ready and active.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 * @returns {boolean}
 */
export const isDatabaseConnected = () => {
    return mongoose.connection.readyState === 1;
};

let retryTimer = null;

/**
 * Asynchronous function to establish a connection to the MongoDB database.
 * Uses Mongoose connect method wrapped inside a try/catch block for resilient error handling.
 */
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const primaryUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ace_logistics";
    const fallbackUri = process.env.MONGODB_ATLAS_URI || "mongodb://127.0.0.1:27017/ace_logistics";

    const attemptConnect = async (uri, label) => {
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 10000,
                family: 4
            });

            if (mongoose.connection.readyState !== 1) {
                await new Promise((resolve) => {
                    if (mongoose.connection.readyState === 1) return resolve();
                    mongoose.connection.once("connected", resolve);
                    setTimeout(resolve, 2000);
                });
            }

            console.log(`\n✅ MongoDB connected successfully via ${label}! Host: ${mongoose.connection.host}`);
            return mongoose.connection;
        } catch (err) {
            console.warn(`⚠️ Connection attempt failed for ${label}:`, err.message || err);
            return null;
        }
    };

    // 1. Attempt primary URI
    let conn = await attemptConnect(primaryUri, "Primary URI");

    // 2. If primary fails and a distinct fallback URI exists, attempt fallback
    if (!conn && fallbackUri && fallbackUri !== primaryUri) {
        console.log("🔄 Trying secondary/fallback MongoDB URI...");
        conn = await attemptConnect(fallbackUri, "Fallback URI");
    }

    // 3. If both failed and primary was not localhost, try local MongoDB
    if (!conn && !primaryUri.includes("127.0.0.1") && !primaryUri.includes("localhost")) {
        console.log("🔄 Trying local MongoDB instance (127.0.0.1:27017)...");
        conn = await attemptConnect("mongodb://127.0.0.1:27017/ace_logistics", "Local MongoDB");
    }

    if (conn) {
        if (retryTimer) {
            clearInterval(retryTimer);
            retryTimer = null;
        }
        return conn;
    }

    // Schedule periodic background retry if still disconnected
    if (!retryTimer) {
        retryTimer = setInterval(async () => {
            if (!isDatabaseConnected()) {
                try {
                    await connectDB();
                } catch {
                    // Silent retry
                }
            }
        }, 15000);
    }

    return null;
};

// Export the connectDB function as default export
export default connectDB;