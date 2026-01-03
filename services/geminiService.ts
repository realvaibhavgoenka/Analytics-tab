import { GoogleGenAI } from "@google/genai";
import { FullAnalysis } from "../types";

export const generateMentorFeedback = async (analysis: FullAnalysis): Promise<string> => {
  let apiKey = '';

  // 1. Try Vite standard (Best for GitHub Pages / Modern Web)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Fallback to process.env (Node.js / Legacy)
  if (!apiKey) {
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env) {
         apiKey = process.env.API_KEY;
      }
    } catch (e) {}
  }
  
  // Production Safeguard: If no key is present, return a graceful fallback instead of crashing
  if (!apiKey || apiKey === 'undefined') {
    console.warn("Gemini API Key missing. Returning placeholder feedback.");
    return `
      **AI Mentor Offline**: 
      We couldn't generate a live AI analysis right now because the API key is missing in the configuration.
      
      However, based on your score of ${analysis.overallScore} and accuracy of ${Math.round(analysis.overallAccuracy)}%, 
      we recommend focusing on your identified weak areas: ${analysis.priorityList.filter(p => p.type === 'FOCUS').map(p => p.topic).join(', ') || 'Review your error logs'}.
    `;
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct a lean prompt to save tokens and focus on value
  const summaryJson = {
    score: analysis.overallScore,
    accuracy: Math.round(analysis.overallAccuracy),
    weaknesses: analysis.priorityList.filter(p => p.type === 'FOCUS').map(p => p.topic),
    timeWasters: analysis.priorityList.filter(p => p.type === 'PAUSE').map(p => p.topic),
    strongAreas: analysis.strongestTopics.slice(0, 3)
  };

  const prompt = `
    You are an expert IPMAT (IIM Indore/Rohtak) entrance exam mentor.
    Analyze this student's mock test performance summary JSON:
    ${JSON.stringify(summaryJson)}

    Write a "Mentor's Note" (max 200 words).
    Structure:
    1. **The Reality Check**: Brutally honest assessment of the score/accuracy.
    2. **The "Fix It" Plan**: 2 specific actionable pieces of advice based on the weaknesses and time wasters provided.
    3. **Strategy for Next Mock**: One golden rule to follow next time.
    
    Tone: Encouraging but strict. Academic and professional.
    Do NOT use generic advice like "work hard". Be specific to the data.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate feedback.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Mentor is currently taking a break. Please try again later.";
  }
};