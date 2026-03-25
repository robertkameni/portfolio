import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    // Access the environment variable directly to avoid Nitro context issues
    const apiKey = process.env['GEMINI_API_KEY'];

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Please check your .env file.');
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}
