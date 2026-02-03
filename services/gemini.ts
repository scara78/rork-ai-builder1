import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, handle missing key gracefully

const ai = new GoogleGenAI({ apiKey });

export const sendMessageToGemini = async (message: string, history: string[]): Promise<string> => {
  try {
    if (!apiKey) return "API Key not configured. Using mock response.";

    const model = 'gemini-3-flash-preview';
    
    // We simulate the persona of the AI Builder
    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: {
        systemInstruction: `You are an intelligent AI coding assistant inside an app builder tool called 'Rork'. 
        Your job is to acknowledge the user's request to build or modify a mobile app. 
        Keep your responses short, professional, and confident, like "Updating the navigation bar..." or "Adding the dark mode feature...". 
        Do not write long code blocks, just confirm the action as if you are performing it in the background.
        The current app context is a social dating app called 'DineDate' or 'Best Friends'.`,
      }
    });

    return response.text || "Changes applied.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection error. Please check your API key.";
  }
};
