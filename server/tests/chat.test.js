const request = require('supertest');
jest.mock('../services/aiService', () => ({ chat: jest.fn() }));

const app = require('../server');
const AuditLog = require('../models/AuditLog');
const aiService = require('../services/aiService');
const { connectTestDB, clearDB, disconnectTestDB, registerUser } = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

describe('Chat & Conversations', () => {
  let tokenA, tokenB;

  beforeEach(async () => {
    ({ token: tokenA } = await registerUser({ email: 'chatA@example.com' }));
    ({ token: tokenB } = await registerUser({ email: 'chatB@example.com', name: 'User B' }));
    aiService.chat.mockResolvedValue({
      content: 'How can I help with your logistics needs?',
      toolResults: [],
    });
  });

  const sendChat = (token, body) =>
    request(app).post('/api/chat').set('Authorization', `Bearer ${token}`).send(body);

  describe('POST /api/chat', () => {
    it('starts a new conversation and persists user + assistant messages', async () => {
      const res = await sendChat(tokenA, { message: 'Where is my shipment?', channel: 'web' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { conversation } = res.body.data;
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[0].role).toBe('user');
      expect(conversation.messages[0].content).toBe('Where is my shipment?');
      expect(conversation.messages[1].role).toBe('assistant');
      expect(conversation.messages[1].content).toBe('How can I help with your logistics needs?');
      expect(conversation.channel).toBe('web');
      expect(aiService.chat).toHaveBeenCalledWith(
        expect.anything(),
        'Where is my shipment?',
        []
      );
    });

    it('appends to an existing conversation when conversationId is supplied', async () => {
      const first = await sendChat(tokenA, { message: 'First question' });
      const conversationId = first.body.data.conversation._id;

      const second = await sendChat(tokenA, { message: 'Second question', conversationId });

      expect(second.status).toBe(200);
      expect(second.body.data.conversation._id).toBe(conversationId);
      expect(second.body.data.conversation.messages).toHaveLength(4);
    });

    it('records a CHATBOT_REQUEST audit log', async () => {
      await sendChat(tokenA, { message: 'Track UPS123456789' });
      const log = await AuditLog.findOne({ action: 'CHATBOT_REQUEST' });
      expect(log).not.toBeNull();
      expect(log.resource).toBe('conversation');
    });

    it('persists every tool result before the assistant reply', async () => {
      aiService.chat.mockResolvedValueOnce({
        content: 'Your shipment is in transit.',
        toolResults: [
          { name: 'getShipmentStatus', data: { currentStatus: 'in_transit' } },
          { name: 'getUserShipments', data: { count: 1 } },
        ],
      });

      const res = await sendChat(tokenA, { message: 'Where is my shipment?' });

      expect(res.status).toBe(200);
      expect(res.body.data.conversation.messages.map((message) => message.role)).toEqual([
        'user',
        'tool',
        'tool',
        'assistant',
      ]);
      expect(res.body.data.conversation.messages[1].toolName).toBe('getShipmentStatus');
      expect(res.body.data.conversation.messages[3].content).toBe('Your shipment is in transit.');
    });

    it('rejects an empty message with 400', async () => {
      const res = await sendChat(tokenA, { message: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'hello' });
      expect(res.status).toBe(401);
    });

    it("denies User B from writing into User A's conversation with 403", async () => {
      const first = await sendChat(tokenA, { message: 'Private message' });
      const conversationId = first.body.data.conversation._id;

      const res = await sendChat(tokenB, { message: 'Intruding', conversationId });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/conversations', () => {
    it("returns only the authenticated user's conversations", async () => {
      await sendChat(tokenA, { message: 'A message one' });
      await sendChat(tokenA, { message: 'A message two', channel: 'mobile' });
      await sendChat(tokenB, { message: 'B message' });

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/conversations');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/conversations/:id - ownership enforcement', () => {
    it('allows the owner to read their own conversation', async () => {
      const created = await sendChat(tokenA, { message: 'My own conversation' });
      const id = created.body.data.conversation._id;

      const res = await request(app)
        .get(`/api/conversations/${id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversation.messages.length).toBeGreaterThan(0);
    });

    it("denies User B access to User A's conversation with 403", async () => {
      const created = await sendChat(tokenA, { message: 'Confidential' });
      const id = created.body.data.conversation._id;

      const res = await request(app)
        .get(`/api/conversations/${id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).not.toContain('Confidential');
    });

    it('returns 404 for a non-existent conversation', async () => {
      const res = await request(app)
        .get('/api/conversations/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });
});
