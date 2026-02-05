
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const improveText = async (text: string): Promise<string> => {
  const safeText = text || "";
  if (!safeText.trim()) return safeText;
  
  const prompt = `다음 텍스트를 더 전문적이고 명확한 비즈니스 문체로 개선해주세요. 내용은 유지하되 문장 구조와 어휘만 다듬어주세요: \n\n${safeText}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "당신은 비즈니스 문서 작성 전문가입니다. 간결하고 신뢰감 있는 문체로 수정하세요.",
        temperature: 0.3,
      }
    });
    return response.text?.trim() || safeText;
  } catch (error) {
    console.error("Improve Text Error:", error);
    return safeText;
  }
};
