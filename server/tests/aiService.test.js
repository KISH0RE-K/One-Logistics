jest.mock('@google/genai', () => ({ GoogleGenAI: jest.fn() }));
jest.mock('../services/toolService', () => ({
  functionDeclarations: [{ name: 'getShipmentStatus' }],
  executeTool: jest.fn(),
}));
jest.mock('../services/ragService', () => ({ searchKnowledgeBase: jest.fn() }));

const { GoogleGenAI } = require('@google/genai');
const { executeTool } = require('../services/toolService');
const { searchKnowledgeBase } = require('../services/ragService');
const { chat } = require('../services/aiService');

describe('AI service', () => {
  const generateContent = jest.fn();
  const originalApiKey = process.env.LLM_API_KEY;

  beforeEach(() => {
    process.env.LLM_API_KEY = 'test-key';
    GoogleGenAI.mockImplementation(() => ({ models: { generateContent } }));
    searchKnowledgeBase.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = originalApiKey;
  });

  it('adds the current message once after prior conversation history', async () => {
    generateContent.mockResolvedValueOnce({ functionCalls: [], text: 'I can help with that.' });

    const result = await chat('user-id', 'Current question', [
      { role: 'user', content: 'Earlier question' },
      { role: 'assistant', content: 'Earlier answer' },
    ]);

    expect(result).toEqual({ content: 'I can help with that.', toolResults: [] });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          { role: 'user', parts: [{ text: 'Earlier question' }] },
          { role: 'model', parts: [{ text: 'Earlier answer' }] },
          { role: 'user', parts: [{ text: 'Current question' }] },
        ],
      })
    );
  });

  it('handles multiple tool calls and continues until it receives text', async () => {
    generateContent
      .mockResolvedValueOnce({
        functionCalls: [
          { id: 'one', name: 'getShipmentStatus', args: { trackingNumber: 'UPS1' } },
          { id: 'two', name: 'getUserShipments', args: {} },
        ],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'getShipmentStatus' } }] } }],
      })
      .mockResolvedValueOnce({
        functionCalls: [{ id: 'three', name: 'getSavedDrafts', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'getSavedDrafts' } }] } }],
      })
      .mockResolvedValueOnce({ functionCalls: [], text: 'I found your shipment and draft.' });
    executeTool
      .mockResolvedValueOnce({ currentStatus: 'in_transit' })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });

    const result = await chat('user-id', 'Check everything', []);

    expect(executeTool).toHaveBeenCalledTimes(3);
    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      content: 'I found your shipment and draft.',
      toolResults: [
        { name: 'getShipmentStatus', data: { currentStatus: 'in_transit' } },
        { name: 'getUserShipments', data: { count: 1 } },
        { name: 'getSavedDrafts', data: { count: 2 } },
      ],
    });

    const secondRequest = generateContent.mock.calls[1][0];
    expect(secondRequest.contents).toContainEqual({
      role: 'user',
      parts: [
        {
          functionResponse: {
            id: 'one',
            name: 'getShipmentStatus',
            response: { output: { currentStatus: 'in_transit' } },
          },
        },
        {
          functionResponse: {
            id: 'two',
            name: 'getUserShipments',
            response: { output: { count: 1 } },
          },
        },
      ],
    });
  });
});
