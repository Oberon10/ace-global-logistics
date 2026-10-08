// Import the Express web framework
import express from "express";

// Import CORS middleware to enable Cross-Origin Resource Sharing
import cors from "cors";

// Import Helmet middleware to secure Express apps by setting various HTTP response headers
import helmet from "helmet";

// Import dotenv to load environment variables from the .env configuration file
import dotenv from "dotenv";

// Import the database connection utility function
import connectDB from "./config/database.js";

// Import authentication route endpoints and database seeder
import authRoutes from "./routes/authRoutes.js";
import { seedDatabaseUsers } from "./controllers/authController.js";

// Import shipment route endpoints
import shipmentRoutes from "./routes/shipmentRoutes.js";

// Import chatbot route endpoints (MongoDB persistence)
import chatRoutes from "./routes/chatRoutes.js";

// Initialize environment configuration from local .env file
dotenv.config();

// Create the core Express application instance
const app = express();

// Base starting port from environment or fallback to 5000
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

// Maximum port search range offset (checks up to DEFAULT_PORT + PORT_RANGE, e.g. 5000 - 5020)
const PORT_RANGE = parseInt(process.env.PORT_RANGE, 10) || 20;

// Upper bound port limit to test (customizable via MAX_PORT or defaults to DEFAULT_PORT + PORT_RANGE)
const MAX_PORT = parseInt(process.env.MAX_PORT, 10) || (DEFAULT_PORT + PORT_RANGE);

// Apply Helmet security middleware to mitigate common web security vulnerabilities
app.use(helmet());

// Configure allowed frontend origins for Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
    // Client URL defined in .env (e.g., https://ace-app-dusky.vercel.app)
    process.env.CLIENT_URL,
    // Production Vercel deployment URL
    "https://ace-app-dusky.vercel.app",
    // Local Vite development servers
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    // Standard alternative local development servers
    "http://localhost:3000",
    "http://127.0.0.1:3000"
].filter(Boolean);

// Apply CORS middleware with explicit origin matching, credentials, and allowed HTTP methods
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server requests or matching client origin domains
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, true);
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-session-id"]
    })
);

// Express JSON body parser middleware to parse incoming request payloads up to 16kb
app.use(express.json({ limit: "16kb" }));

// Express URL-encoded body parser middleware to parse form-encoded data
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Root health check endpoint for deployment probes and connectivity verification
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ACE Logistics Backend API is operational.",
        database: "MongoDB (Mongoose)",
        timestamp: new Date().toISOString()
    });
});

// Dedicated health endpoint providing system status information
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "ACE Logistics API",
        database: "MongoDB (Mongoose)",
        uptime: process.uptime()
    });
});

// Mount user authentication routes at /api/auth
app.use("/api/auth", authRoutes);

// Mount logistics shipment routes at /api/shipments
app.use("/api/shipments", shipmentRoutes);

// Mount chatbot routes at /api/chat (MongoDB-backed prompt & response persistence)
app.use("/api/chat", chatRoutes);

// Catch-all 404 handler for undefined API routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Route '${req.originalUrl}' not found on ACE Logistics API.`,
        message: `Route '${req.originalUrl}' not found on ACE Logistics API.`
    });
});

// Global central error-handling middleware catching all unhandled application errors
app.use((err, req, res, next) => {
    console.error("❌ Unhandled Application Error:", err);

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "An unexpected internal server error occurred.",
        message: err.message || "An unexpected internal server error occurred.",
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
});

/**
 * Starts the HTTP server on an available port within the specified range.
 * If the target port is blocked or in use (EADDRINUSE), it automatically cycles
 * to the next port until a free port is found or the range is exhausted.
 */
const listenWithPortFallback = (currentPort, maxPort) => {
    return new Promise((resolve, reject) => {
        const server = app.listen(currentPort);

        server.on("listening", () => {
            const address = server.address();
            const activePort = typeof address === "object" && address ? address.port : currentPort;

            // Update app locals and environment variable with the active port
            app.set("port", activePort);
            process.env.PORT = String(activePort);

            console.log(`🚀 ACE Logistics Server running successfully on port ${activePort}`);
            console.log(`🌐 Base API URL: http://localhost:${activePort}`);
            console.log(`🍃 Database: Pure MongoDB Mongoose Architecture`);

            resolve(server);
        });

        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                console.warn(`⚠️ Port ${currentPort} is currently blocked or already in use.`);
                if (currentPort < maxPort) {
                    const nextPort = currentPort + 1;
                    console.log(`🔄 Automatically trying next available port in range: ${nextPort}...`);
                    listenWithPortFallback(nextPort, maxPort).then(resolve).catch(reject);
                } else {
                    const errorMsg = `❌ No available ports found in range ${DEFAULT_PORT} to ${maxPort}. Please free up a port or increase PORT_RANGE.`;
                    console.error(errorMsg);
                    reject(new Error(errorMsg));
                }
            } else {
                console.error("❌ Fatal server startup error:", err);
                reject(err);
            }
        });
    });
};

/**
 * Bootstrap function: Connects to MongoDB database, seeds default accounts, and starts the HTTP server.
 */
const startServer = async () => {
    try {
        await connectDB();
        // Seed default operational accounts into MongoDB
        await seedDatabaseUsers();
    } catch (error) {
        console.warn("⚠️ Initial database connection warning:", error.message);
    }

    try {
        await listenWithPortFallback(DEFAULT_PORT, MAX_PORT);
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
    }
};

// Execute bootstrap startup process
startServer();

// Export the Express app instance for testing and external server configurations
export default app;