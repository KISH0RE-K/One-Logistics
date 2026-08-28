const express = require('express');
const { sendMessage, getConversations, getConversation } = require('../controllers/chatController');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { chatMessageSchema } = require('../utils/validators');

// Two routers are exported so each can be mounted on its own base path.
// Mounting a single router on the bare '/api' prefix would apply its
// middleware to every other /api route (including public tracking).
const chatRouter = express.Router();
const conversationRouter = express.Router();

/**
 * @openapi
 * /api/chat:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message to the AI assistant
 *     description: >
 *       Persists the user message and returns the updated conversation.
 *       The assistant reply is currently a fixed placeholder - the LLM is not
 *       wired up yet. Future integration will pass the conversation history plus
 *       approved tool definitions to the LLM.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: 'Where is my shipment?' }
 *               conversationId: { type: string, description: 'Omit to start a new conversation' }
 *               channel: { type: string, enum: [web, mobile], default: web }
 *     responses:
 *       200:
 *         description: Updated conversation including the assistant reply
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Conversation belongs to another user
 */
chatRouter.post('/', authenticateUser, validate(chatMessageSchema), sendMessage);

/**
 * @openapi
 * /api/conversations:
 *   get:
 *     tags: [Chat]
 *     summary: List all conversations for the authenticated user
 *     description: Message bodies are omitted; fetch a single conversation for the full transcript.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation summaries, newest first
 *       401:
 *         description: Unauthorized
 */
conversationRouter.get('/', authenticateUser, getConversations);

/**
 * @openapi
 * /api/conversations/{id}:
 *   get:
 *     tags: [Chat]
 *     summary: Get a full conversation with all messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full conversation
 *       403:
 *         description: Conversation belongs to another user
 *       404:
 *         description: Conversation not found
 */
conversationRouter.get('/:id', authenticateUser, getConversation);

module.exports = { chatRouter, conversationRouter };
