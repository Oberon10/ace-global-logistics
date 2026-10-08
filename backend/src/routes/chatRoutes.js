import { Router } from "express";
import { sendMessage, getChatHistory, clearChatHistory } from "../controllers/chatController.js";

const router = Router();

/**
 * @route   POST /api/chat
 * @desc    Submit user chat message, generate AI response, and persist to MongoDB
 * @access  Public
 */
router.post("/", sendMessage);

/**
 * @route   GET /api/chat/history/:sessionId
 * @desc    Fetch chat history for a session from MongoDB
 * @access  Public
 */
router.get("/history/:sessionId", getChatHistory);

/**
 * @route   GET /api/chat
 * @desc    Fetch chat history via query parameter ?sessionId=...
 * @access  Public
 */
router.get("/", getChatHistory);

/**
 * @route   DELETE /api/chat/history/:sessionId
 * @desc    Clear session conversation history from MongoDB
 * @access  Public
 */
router.delete("/history/:sessionId", clearChatHistory);

export default router;
