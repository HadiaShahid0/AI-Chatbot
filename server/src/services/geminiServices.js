import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction = `
You are a helpful AI programming assistant.

Rules:
- Explain technical concepts in simple English.
- Give clear and accurate answers.
- If you are unsure about something, say that you are unsure.
- Do not make up information.
- Use the conversation context when answering questions.
- Keep answers easy to understand.
`;

export const generateGeminiResponse = async (contents) => {
  console.log("Sending request to Gemini...");

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  console.log("Gemini response received.");

  return response.text;
};

