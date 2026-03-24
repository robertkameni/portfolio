import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env['GEMINI_API_KEY'];

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Using the faster model for real-time analysis
  generationConfig: {
    responseMimeType: 'application/json', // Enforce structured JSON output
  },
});

/**
 * A simple client to interact with the Google Gemini API.
 */
export const geminiClient = {
  /**
   * Generates content from a given text prompt.
   * @param prompt The text prompt to send to the model.
   * @returns The generated content as a JSON object.
   */
  async generateJson<T>(prompt: string): Promise<T | null> {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // The model is configured to return JSON, so we parse it.
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Error generating content from Gemini:', error);
      return null;
    }
  },
};
