const conversationService = require('../services/conversationService');
const auditService = require('../services/auditService');

/**
 * POST /api/chat
 *
 * Stores the user message and returns a placeholder assistant reply.
 *
 * Future integration point:
 *   1. Pass conversation history + available tool definitions to LLM.
 *   2. LLM calls approved service functions (shipmentService, vehicleService, etc.).
 *   3. Results are fed back to LLM.
 *   4. LLM produces a final assistant reply.
 *   5. Both the user message and assistant reply are persisted.
 *
 * Available LLM-callable functions (to be wired in future):
 *   - getShipmentStatus(trackingNumber)
 *   - getUserShipments(userId, filters)
 *   - getSavedDrafts(userId)
 *   - getAvailableVehicles(location, weight)
 *   - getShippingRecommendation(shipmentData)
 *   - createShipment(userId, shipmentData)
 *
 * The LLM must NEVER receive direct DB access — only these approved function calls.
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId, channel } = req.body;
    const userId = req.user._id;

    // 1. Persist the user message
    const conversation = await conversationService.addMessage(
      userId,
      { role: 'user', content: message },
      conversationId || null,
      channel || 'web'
    );

    // 2. [FUTURE LLM] Generate assistant reply
    //    const llmReply = await llmService.chat({ messages: conversation.messages, tools, userId });
    const assistantReply = {
      role: 'assistant',
      content:
        'Thank you for your message. Our AI assistant is being set up and will be available soon. For immediate help, please use the shipment tracking or contact support.',
    };

    // 3. Persist assistant reply
    await conversationService.addMessage(userId, assistantReply, conversation._id, channel || 'web');

    // 4. Audit log
    await auditService.log({
      userId,
      action: 'CHATBOT_REQUEST',
      resource: 'conversation',
      resourceId: conversation._id,
    });

    // 5. Return full updated conversation
    const updated = await conversationService.getConversationById(conversation._id, userId);
    res.json({ success: true, data: { conversation: updated } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/conversations */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getUserConversations(req.user._id);
    res.json({ success: true, data: { conversations, count: conversations.length } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/conversations/:id */
const getConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
    res.json({ success: true, data: { conversation } });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversations, getConversation };
