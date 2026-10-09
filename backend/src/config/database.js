
import mongoose from "mongoose";

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
            "MONGODB_URI must contain your MongoDB Atlas connection string."
        );
    }

    connectionPromise = (async () => {
        try {
            await mongoose.connect(primaryUri, {
                serverSelectionTimeoutMS: 10000,
                family: 4
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

            throw error;
        } finally {
            connectionPromise = null;
        }
    })();

    return connectionPromise;
};

export default connectDB;