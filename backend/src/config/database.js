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
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.warn("⚠️ MONGODB_URI environment variable is not defined in .env file.");
            return null;
        }

        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 10000,
            family: 4
        });

        // Ensure connection is fully in readyState 1 (connected)
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                if (mongoose.connection.readyState === 1) return resolve();
                mongoose.connection.once("connected", resolve);
                setTimeout(resolve, 3000);
            });
        }

        console.log(`\n✅ MongoDB connected successfully! Host: ${mongoose.connection.host || "Atlas Cluster"}`);

        if (retryTimer) {
            clearInterval(retryTimer);
            retryTimer = null;
        }

        return mongoose.connection;
    } catch (error) {
        console.warn("⚠️ MongoDB connection notice:", error.message || error);
        console.warn("💡 Tip: Ensure your MongoDB Atlas IP access list includes your IP (or 0.0.0.0/0).");

        // Schedule periodic background retry
        if (!retryTimer) {
            retryTimer = setInterval(async () => {
                if (!isDatabaseConnected() && process.env.MONGODB_URI) {
                    try {
                        await mongoose.connect(process.env.MONGODB_URI, {
                            serverSelectionTimeoutMS: 8000,
                            socketTimeoutMS: 10000,
                            family: 4
                        });
                        console.log("\n✅ Reconnected to MongoDB Atlas in background!");
                        clearInterval(retryTimer);
                        retryTimer = null;
                    } catch {
                        // Silent retry in background
                    }
                }
            }, 60000);
        }

        return null;
    }
};

// Export the connectDB function as default export
export default connectDB;