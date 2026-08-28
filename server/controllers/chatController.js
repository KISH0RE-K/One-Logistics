const conversationService = require('../services/conversationService');
const auditService = require('../services/auditService');
const aiService = require('../services/aiService');

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

    // 2. LLM call
    try {
      // `message` is passed separately, so exclude the just-persisted user
      // turn from history. Including it twice makes the model treat one
      // question as two separate requests.
      const llmResponse = await aiService.chat(userId, message, conversation.messages.slice(0, -1));

      for (const toolResult of llmResponse.toolResults || []) {
        await conversationService.addMessage(
          userId,
          {
            role: 'tool',
            toolName: toolResult.name,
            toolResult: toolResult.data,
            content: JSON.stringify(toolResult.data ?? {}),
          },
          conversation._id,
          channel || 'web'
        );
      }

      // Persist the assistant's natural language reply
      await conversationService.addMessage(
        userId,
        { role: 'assistant', content: llmResponse.content },
        conversation._id,
        channel || 'web'
      );
    } catch (err) {
      console.error(err);
      await conversationService.addMessage(
        userId,
        { role: 'assistant', content: 'I apologize, but I am currently unavailable or missing an API key configuration.' },
        conversation._id,
        channel || 'web'
      );
    }

    // 3. Audit log
    await auditService.log({
      userId,
      action: 'CHATBOT_REQUEST',
      resource: 'conversation',
      resourceId: conversation._id,
    });

    // 4. Return updated conversation
    const updated = await conversationService.getConversationById(conversation._id, userId);
    res.json({
      success: true,
      data: { conversation: updated }
    });
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getUserConversations(req.user._id);
    res.json({ success: true, data: { conversations, count: conversations.length } });
  } catch (err) {
    next(err);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
    res.json({ success: true, data: { conversation } });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversations, getConversation };
