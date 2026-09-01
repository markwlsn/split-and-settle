const { GoogleGenAI } = require('@google/genai');

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

module.exports = { getGeminiClient };
