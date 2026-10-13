import { GoogleGenAI } from "@google/genai";
import { AllergenHit } from "./allergen";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

export async function explainAllergensWithGemini(
  hits: AllergenHit[],
  ingredientConfidence: number
): Promise<string> {
  if (hits.length === 0) {
    return "No known allergens were detected in the provided ingredients.";
  }

  const contains = hits.filter(h => h.tier === "contains");
  const mayContain = hits.filter(h => h.tier === "may_contain");

  const prompt = `You are a food safety assistant for the Tracee app in Nigeria. 
I have mapped the following ingredients to plain-language allergens based on our dictionary.

DIRECT INGREDIENTS (High certainty):
${contains.map(h => `- ${h.matchedTerm} (maps to ${h.label})`).join("\n") || "None"}

CROSS-CONTAMINATION / MAY CONTAIN (Lower certainty):
${mayContain.map(h => `- ${h.matchedTerm} (maps to ${h.label})`).join("\n") || "None"}

The OCR confidence for this scan was ${Math.round(ingredientConfidence * 100)}%.

Write a concise, plain-language explanation (max 3 sentences) for a consumer. 
Treat "may contain" statements as a separate, lower-certainty tier.
Do NOT give medical advice. Do NOT list the raw terms, just summarize the risks using the plain-language labels.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Could not generate an explanation.";
  } catch (error) {
    console.error("Gemini Allergen Explanation Error:", error);
    return "We detected allergens, but could not generate a summary at this time.";
  }
}

