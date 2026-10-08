import mongoose from "mongoose";

/**
 * Chat schema for persisting chatbot user prompts and AI responses in MongoDB.
 */
const chatSchema = new mongoose.Schema(
    {
        // Session identifier for grouping user-bot conversation turns
        sessionId: {
            type: String,
            required: [true, "Session ID is required"],
            trim: true,
            index: true
        },
        // Optional user reference or identifier (ObjectId or custom string)
        userId: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        // Optional user email for tracking guest or logged-in interactions
        userEmail: {
            type: String,
            trim: true,
            default: null
        },
        // Role in conversation ('user' | 'assistant' | 'system')
        role: {
            type: String,
            enum: ["user", "assistant", "system", "bot"],
            default: "user"
        },
        // Sender label ('user' | 'bot')
        sender: {
            type: String,
            enum: ["user", "bot", "assistant"],
            default: "user"
        },
        // Content of the message
        message: {
            type: String,
            required: [true, "Message text is required"],
            trim: true
        },
        // Detected logistics intent (e.g., TRACKING, QUOTE, DELIVERY, CUSTOMS, SUPPORT, GENERAL)
        intent: {
            type: String,
            default: "GENERAL"
        },
        // Metadata containing parameters, rate calculations, or tokens
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Compound index for high performance chronological session retrieval
chatSchema.index({ sessionId: 1, createdAt: 1 });
chatSchema.index({ userId: 1, createdAt: -1 });

// Compile or reuse Mongoose Chat model
const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default Chat;
