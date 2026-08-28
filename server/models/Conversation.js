const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'tool'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // For future LLM function-calling support
    toolName: { type: String },
    toolResult: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'web',
    },
    title: {
      type: String,
      default: 'New Conversation',
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
