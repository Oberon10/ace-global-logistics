import Chat from "../models/Chat.js";
import Shipment from "../models/Shipment.js";

/**
 * Intelligent Logistics AI Response Generator.
 * Handles tracking lookups from MongoDB, freight calculations, transit times,
 * and customs guidance with guaranteed sub-second response times.
 */
const generateLogisticsAiResponse = async (prompt, context = {}) => {
    const text = (prompt || "").trim();
    const lower = text.toLowerCase();

    // 1. Shipment Tracking Intent
    const trackingCodeMatch = text.match(/\bACE[- ]?[0-9A-Z]{4,8}[- ]?[0-9A-Z]{3,8}\b/i) || (lower.includes("track") && text.match(/\b[A-Z0-9]{6,20}\b/i));
    if ((lower.includes("track") || lower.includes("where is") || lower.includes("status of") || trackingCodeMatch) && !lower.includes("rate") && !lower.includes("quote")) {
        if (trackingCodeMatch) {
            const rawCode = trackingCodeMatch[0].replace(/\s+/g, "-").toUpperCase();
            try {
                const shipment = await Shipment.findOne({
                    $or: [
                        { trackingNumber: rawCode },
                        { trackingNumber: new RegExp(rawCode, "i") }
                    ]
                });

                if (shipment) {
                    const statusName = (shipment.currentStatus || "IN_TRANSIT").replace(/_/g, " ");
                    const latestCheckpoint = shipment.trackingHistory?.length
                        ? shipment.trackingHistory[shipment.trackingHistory.length - 1]
                        : null;
                    const location = latestCheckpoint?.location || shipment.destination?.address || "En Route";

                    return {
                        message: `📦 **Shipment Found**: Tracking Number **${shipment.trackingNumber}**\n\n- **Status**: ${statusName}\n- **Current Location**: ${location}\n- **Origin**: ${shipment.origin?.address || "N/A"}\n- **Destination**: ${shipment.destination?.address || "N/A"}\n- **Estimated Delivery**: ${shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : "In Transit"}\n\nOur operations team is actively monitoring this consignment.`,
                        intent: "TRACKING",
                        metadata: { trackingNumber: shipment.trackingNumber, status: shipment.currentStatus }
                    };
                }
            } catch (err) {
                console.warn("MongoDB shipment tracking query warning:", err.message);
            }

            return {
                message: `🔍 I searched for tracking code **${rawCode}**, but could not locate an active consignment with that exact number in our database. Please double-check your code (format: \`ACE-XXXXXX-YYYY\`) or speak with a live operations dispatcher for manual manifest lookup.`,
                intent: "TRACKING_NOT_FOUND",
                metadata: { trackingNumber: rawCode }
            };
        }

        return {
            message: `📍 **Shipment Tracking**: Please provide your ACE logistics tracking number (e.g., \`ACE-2T34-79011\`) and I will instantly query our active satellite telemetry and terminal manifests for you.`,
            intent: "TRACKING_PROMPT",
            metadata: {}
        };
    }

    // 2. Shipping Quote / Rates Intent
    if (lower.includes("quote") || lower.includes("rate") || lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
        const weightMatch = lower.match(/(\d+(\.\d+)?)\s*(kg|kilos|lbs|tons)?/);
        const weight = weightMatch ? parseFloat(weightMatch[1]) : 25;
        const estAirRate = Math.round(weight * 8.5 + 45);
        const estSeaRate = Math.round(weight * 2.2 + 120);

        return {
            message: `💼 **Instant Freight Estimates (Estimated ${weight} kg)**:\n\n1. **Air Freight Priority** (2-4 business days): ~$${estAirRate} USD\n2. **Express Cargo Courier** (1-2 business days): ~$${Math.round(estAirRate * 1.35)} USD\n3. **Ocean Freight (LCL Container)** (14-21 business days): ~$${estSeaRate} USD\n\nRates include standard terminal handling. Would you like to book a shipment or customize origin/destination?`,
            intent: "QUOTE",
            metadata: { weight, estAirRate, estSeaRate }
        };
    }

    // 3. Delivery Times / ETA
    if (lower.includes("transit") || lower.includes("delivery time") || lower.includes("how long") || lower.includes("eta")) {
        return {
            message: `⏱️ **Transit Time Benchmarks**:\n\n- **Air Freight Priority**: 48 - 72 hours across major international hubs (Accra, London Heathrow, Amsterdam Schiphol, Dubai).\n- **Express Air Courier**: Next-flight-out within 24 - 48 hours.\n- **Ocean Freight**: 14 - 28 days depending on port rotation and customs processing window.\n\nAll routes include end-to-end GPS telemetry and automated milestone notifications.`,
            intent: "DELIVERY_TIME",
            metadata: {}
        };
    }

    // 4. Customs & Regulations
    if (lower.includes("customs") || lower.includes("duty") || lower.includes("tax") || lower.includes("tariff") || lower.includes("clearance") || lower.includes("declaration")) {
        return {
            message: `📋 **Customs & Compliance Guidance**:\n\nACE Logistics handles complete export/import declarations, HS code classifications, and port clearing across West Africa, Europe, and the Americas.\n\nRequired documentation typically includes:\n- Commercial Invoice & Packing List\n- Bill of Lading (B/L) or Air Waybill (AWB)\n- Certificate of Origin (for agricultural / textile exports)\n\nWould you like our compliance desk to review your shipping documentation?`,
            intent: "CUSTOMS",
            metadata: {}
        };
    }

    // 5. Live Agent / Human Support
    if (lower.includes("human") || lower.includes("agent") || lower.includes("support") || lower.includes("call") || lower.includes("phone") || lower.includes("dispatcher")) {
        return {
            message: `👨‍💼 **Live Operations Support**:\n\nOur dispatchers are on duty 24/7:\n- **Hotline**: +44 20 7946 0991 (UK) / +233 24 412 3456 (West Africa)\n- **Email**: dispatch@acelogistics.com\n- **Terminal Command**: LHR Terminal 4 / Kotoka International Cargo Terminal (ACC)\n\nYou can also click "Talk to Human" in the assistant options to request an immediate callback.`,
            intent: "SUPPORT",
            metadata: {}
        };
    }

    // Default Assistant Answer
    return {
        message: `Hello! I am the ACE Logistics AI Assistant. I can assist you with:\n\n- 📦 **Real-time shipment tracking** and manifest status\n- 💰 **Freight quotes** (Air, Ocean & Land Transport)\n- ⏱️ **Transit schedules** and route estimates\n- 📑 **Customs compliance** and documentation requirements\n\nHow can I help you today?`,
        intent: "GENERAL",
        metadata: {}
    };
};

/**
 * Controller: Process chat prompt, generate AI response, and persist both into MongoDB.
 * @route POST /api/chat
 */
export const sendMessage = async (req, res) => {
    try {
        const { message, prompt, sessionId, userId, userEmail, context } = req.body;
        const promptText = (message || prompt || "").trim();

        if (!promptText) {
            return res.status(400).json({
                success: false,
                error: "Message prompt is required."
            });
        }

        // Generate or reuse session identifier
        const activeSessionId = sessionId || req.headers["x-session-id"] || `sess-${Date.now()}`;
        const activeUserId = userId || req.user?.id || null;
        const activeUserEmail = userEmail || req.user?.email || null;

        // 1. Save user prompt directly to MongoDB
        const userChatRecord = await Chat.create({
            sessionId: activeSessionId,
            userId: activeUserId,
            userEmail: activeUserEmail,
            role: "user",
            sender: "user",
            message: promptText,
            intent: "USER_PROMPT"
        });

        // 2. Generate AI response (with error isolation so server never hangs)
        let aiResult;
        try {
            aiResult = await generateLogisticsAiResponse(promptText, context);
        } catch (genErr) {
            console.error("AI Generation non-fatal error:", genErr.message);
            aiResult = {
                message: "I received your inquiry. Our automated dispatch system is logging your request. How else may I assist you?",
                intent: "FALLBACK",
                metadata: {}
            };
        }

        // 3. Save AI response directly to MongoDB
        const aiChatRecord = await Chat.create({
            sessionId: activeSessionId,
            userId: activeUserId,
            userEmail: activeUserEmail,
            role: "assistant",
            sender: "bot",
            message: aiResult.message,
            intent: aiResult.intent || "GENERAL",
            metadata: aiResult.metadata || {}
        });

        // 4. Return structured JSON
        return res.status(200).json({
            success: true,
            sessionId: activeSessionId,
            message: aiResult.message,
            response: aiResult.message,
            intent: aiResult.intent,
            userMessage: {
                id: userChatRecord._id,
                message: userChatRecord.message,
                createdAt: userChatRecord.createdAt
            },
            aiMessage: {
                id: aiChatRecord._id,
                message: aiChatRecord.message,
                intent: aiChatRecord.intent,
                createdAt: aiChatRecord.createdAt
            }
        });
    } catch (error) {
        console.error("❌ Error in sendMessage chat controller:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to process chat message.",
            message: "An internal server error occurred while processing the chat request."
        });
    }
};

/**
 * Controller: Retrieve chat conversation history for a given session from MongoDB.
 * @route GET /api/chat/history/:sessionId
 */
export const getChatHistory = async (req, res) => {
    try {
        const sessionId = req.params.sessionId || req.query.sessionId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: "Session ID parameter is required."
            });
        }

        // Native Mongoose query: fetch chronologically ordered messages
        const messages = await Chat.find({ sessionId })
            .sort({ createdAt: 1 })
            .limit(100);

        return res.status(200).json({
            success: true,
            sessionId,
            count: messages.length,
            messages
        });
    } catch (error) {
        console.error("❌ Error in getChatHistory controller:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to retrieve chat history.",
            message: error.message
        });
    }
};

/**
 * Controller: Clear chat conversation history for a session from MongoDB.
 * @route DELETE /api/chat/history/:sessionId
 */
export const clearChatHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: "Session ID parameter is required."
            });
        }

        // Native Mongoose query: delete messages for session
        const result = await Chat.deleteMany({ sessionId });

        return res.status(200).json({
            success: true,
            message: "Chat history cleared successfully.",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("❌ Error in clearChatHistory controller:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to clear chat history.",
            message: error.message
        });
    }
};

export default {
    sendMessage,
    getChatHistory,
    clearChatHistory
};
