const Conversation = require('../models/Conversation');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new conversation for a user.
 */
const createConversation = async (userId, channel = 'web') => {
  return Conversation.create({ userId, channel, messages: [] });
};

/**
 * Add a message to a conversation, creating one if conversationId is null.
 * LLM function: addMessage(userId, message, conversationId)
 */
const addMessage = async (userId, message, conversationId = null, channel = 'web') => {
  let conversation;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    if (conversation.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }
  } else {
    conversation = await createConversation(userId, channel);
  }

  conversation.messages.push({ ...message, timestamp: new Date() });
  await conversation.save();
  return conversation;
};

/**
 * Get conversation summaries (without messages) for a user.
 * LLM function: getUserConversations(userId)
 */
const getUserConversations = async (userId) => {
  return Conversation.find({ userId }).select('-messages').sort({ updatedAt: -1 });
};

/**
 * Get a full conversation by ID, enforcing ownership.
 */
const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (conversation.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }
  return conversation;
};

module.exports = {
  createConversation,
  addMessage,
  getUserConversations,
  getConversationById,
};
