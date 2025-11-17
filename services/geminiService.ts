import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = 'AIzaSyAjBk8oZzxQAluqK2Wh5RfQyhld94AGU4s';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash'; // Using Flash for faster responses, can switch to 'gemini-2.5-pro' for more complex tasks

export const summarizeText = async (articleId: string, text: string): Promise<string> => {
  const cacheKey = `summary:${articleId}`;
  try {
    const cachedSummary = localStorage.getItem(cacheKey);
    if (cachedSummary) {
      return JSON.parse(cachedSummary);
    }
  } catch (e) {
    console.error("Failed to read summary from localStorage", e);
  }

  if (!text) {
    return "No content provided to summarize.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Summarize the following news article in 3 to 4 concise sentences. Focus on the key information and main points. The summary should be easy to read and understand for a general audience. \n\n---\n\n${text}`,
    });
    
    // Handle different possible response structures
    const summary = response?.text || response?.response?.text() || response?.candidates?.[0]?.content?.parts?.[0]?.text || String(response);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(summary));
    } catch (e) {
      console.error("Failed to save summary to localStorage", e);
    }
    return summary;

  } catch (error: any) {
    console.error("Error summarizing text with Gemini API:", error);
    console.error("Error details:", error?.message, error?.response, error?.status);
    throw new Error(`Failed to generate summary from AI: ${error?.message || 'Unknown error'}`);
  }
};

export const translateToUrdu = async (articleId: string, text: string): Promise<string> => {
  const cacheKey = `translation:${articleId}`;
  try {
    const cachedTranslation = localStorage.getItem(cacheKey);
    if (cachedTranslation) {
      return JSON.parse(cachedTranslation);
    }
  } catch (e) {
    console.error("Failed to read translation from localStorage", e);
  }

  if (!text) {
    return "No text provided to translate.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Translate the following English text to Urdu:\n\n---\n\n${text}`,
    });
    
    // Handle different possible response structures
    const translation = response?.text || response?.response?.text() || response?.candidates?.[0]?.content?.parts?.[0]?.text || String(response);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(translation));
    } catch (e) {
      console.error("Failed to save translation to localStorage", e);
    }
    return translation;

  } catch (error: any) {
    console.error("Error translating text with Gemini API:", error);
    console.error("Error details:", error?.message, error?.response, error?.status);
    throw new Error(`Failed to translate text from AI: ${error?.message || 'Unknown error'}`);
  }
};