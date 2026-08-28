import api, { unwrap, getChannel } from './axios';

/**
 * AI assistant + conversation history.
 *
 * The LLM is not wired up in the backend yet: POST /api/chat persists the
 * user's message and returns the conversation with a placeholder assistant
 * reply. The frontend renders whatever the backend returns and never invents
 * an answer of its own, so the day the LLM is connected this page starts
 * working with no frontend change.
 *
 *   POST /api/chat { message, conversationId?, channel? } -> { conversation }
 *   GET  /api/conversations                               -> { conversations }
 *   GET  /api/conversations/:id                           -> { conversation }
 */

export async function sendMessage({ message, conversationId }) {
  const body = { message, channel: getChannel() };
  if (conversationId) body.conversationId = conversationId;
  const res = await api.post('/chat', body);
  return unwrap(res)?.conversation ?? null;
}

export async function getConversations() {
  const res = await api.get('/conversations');
  return unwrap(res)?.conversations ?? [];
}

export async function getConversation(id) {
  const res = await api.get(`/conversations/${id}`);
  return unwrap(res)?.conversation ?? null;
}
