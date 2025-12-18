import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

const API_KEY = GEMINI_API_KEY;

if (!API_KEY) {
  console.error('⚠️ Gemini API key not configured.');
}

const genAI = new GoogleGenerativeAI(API_KEY);



export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // ✅ Updated model name
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

// const models = await genAI.listModels();
// console.log(models);


export const SYSTEM_PROMPT = `You are LifeSaver AI, a specialized assistant for the LifeSaver blood donation app.

STRICT RULES:
1. ONLY answer questions related to:
   - Blood donation and transfusion
   - Hospitals and medical facilities
   - Blood types and compatibility
   - Donation eligibility and requirements
   - App features and navigation
   - Health topics related to blood donation

2. For ANY unrelated questions (sports, weather, politics, general knowledge, etc.):
   - Politely decline and redirect to blood/hospital topics
   - DO NOT answer the question
   - Remind user of your specialized purpose

3. Be helpful, concise, and accurate
4. Use medical facts and WHO guidelines
5. Prioritize user safety and health

Your responses should be friendly but focused only on blood donation and hospital-related topics.`;

export const testGeminiConnection = async () => {
  try {
    const result = await geminiModel.generateContent("Hello Gemini!");
    const response = await result.response;
    console.log('✅ Gemini API connection successful:', response.text());
    return true;
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error.message);
    return false;
  }
};

