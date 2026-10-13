import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

export async function inferOcrText(rawText: string, productName?: string): Promise<string> {
  if (!rawText || rawText.trim().length === 0) return "";
  
  const prompt = `You are an AI assistant helping to clean up raw OCR (Optical Character Recognition) text extracted from a product label.
The text might contain typos, misread characters, or partial words.

Raw OCR Text:
"${rawText}"

Product Name (Context): ${productName || "Unknown"}

Please return ONLY the corrected, clean version of the text. Do not add any conversational filler. Fix obvious misspellings based on common food/cosmetic ingredients. Keep the original structure as much as possible.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("Gemini OCR Inference Error:", error);
    return rawText; // Fallback to raw text if AI fails
  }
}

