import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getSkinAdvice(concern: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Better than Skinless.com's lead ritual consultant. A client has the following concern: "${concern}". 
      You represent our curated skin rituals:
      1. Vibe Rituals (Active & Efficacious): High-activity serums and modern formulations.
      2. Aura Rituals (Luxury & Holistic): Premium textures and ritual-focused care.
      3. Botanica Rituals (Pure & Plant-Based): Nature-derived purity for sensitive skin.
      
      Provide a luxury-toned, dermatologically-sound, and encouraging response. 
      Keep it concise (max 3 sentences) and suggest ingredients like Ceramides, Vitamin C, or Hyaluronic Acid.
      The tone should be sophisticated, authoritative yet soothing.`
    });
    
    return response.text || "Our consultants have curated a special ritual for you, but the connection is currently being refined. Please try again soon.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Our consultants are currently attending to other refined clients. Please try again in a moment.";
  }
}
