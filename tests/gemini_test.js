require('dotenv').config();
const { getGeminiClient } = require('../src/lib/geminiClient');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const ai = getGeminiClient();
    console.log('Testing simple Gemini text call...');

    const textResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: 'Say hello in JSON format like {"message":"hello"}' }] }],
    });

    const rawText = textResponse.text || (textResponse.candidates && textResponse.candidates[0]?.content?.parts?.[0]?.text) || '';
    console.log('Text response:', rawText);
    console.log('Gemini text OK');
  } catch (err) {
    console.error('TEXT ERROR:', err.message);
    return;
  }

  // Now test with a small image (1x1 red pixel PNG, base64)
  const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';

  try {
    const ai = getGeminiClient();
    console.log('\nTesting image input call...');
    const imgResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: testImage } },
          { text: 'What color is this 1x1 pixel image? Reply in JSON: {"color": "answer"}' }
        ]
      }],
    });

    const rawImg = imgResponse.text || (imgResponse.candidates && imgResponse.candidates[0]?.content?.parts?.[0]?.text) || '';
    console.log('Image response:', rawImg);
    console.log('Gemini multimodal OK');
  } catch (err) {
    console.error('IMAGE ERROR:', err.message);
    console.error('Full:', JSON.stringify(err, null, 2));
  }
}

test();
