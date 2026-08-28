const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const kbPath = path.join(__dirname, '../knowledge_base');
let documents = [];

const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const initRAG = async () => {
  if (!process.env.LLM_API_KEY) {
    console.warn("RAG Warning: LLM_API_KEY not set. RAG is disabled.");
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
  
  try {
    const files = fs.readdirSync(kbPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(kbPath, file), 'utf-8');
        const response = await ai.models.embedContent({
         model: "gemini-embedding-001",
          contents: content,
        });
        documents.push({
          title: file,
          content: content,
          embedding: response.embeddings[0].values
        });
      }
    }
    console.log(`RAG: Loaded and embedded ${documents.length} knowledge base documents.`);
  } catch (error) {
    console.error("RAG Init Error:", error.message);
  }
};

const searchKnowledgeBase = async (query, topK = 1) => {
  if (documents.length === 0 || !process.env.LLM_API_KEY) return null;
  
  const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
  try {
    const queryResponse = await ai.models.embedContent({
    model: "gemini-embedding-001",
      contents: query,
    });
    
    const queryEmbedding = queryResponse.embeddings[0].values;
    
    const scoredDocs = documents.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    
    scoredDocs.sort((a, b) => b.score - a.score);
    
    // threshold
    if (scoredDocs[0].score > 0.6) {
      return scoredDocs.slice(0, topK).map(d => `--- SOURCE: ${d.title} ---\n${d.content}`).join('\n\n');
    }
    return null;
  } catch (error) {
    console.error("RAG Search Error:", error.message);
    return null;
  }
};

// Embedding the knowledge base is a production startup concern. Keeping it
// out of tests prevents an external API request whenever the Express app is
// imported by an otherwise isolated test.
if (process.env.NODE_ENV !== 'test') initRAG();

module.exports = { searchKnowledgeBase };
