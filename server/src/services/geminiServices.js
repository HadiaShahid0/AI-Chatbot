import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction = `
You are a helpful AI assistant.

General Rules:
- Explain technical concepts in simple, easy-to-understand English.
- Give clear, accurate, and relevant answers.
- If you are unsure about something, clearly say so instead of guessing.
- Do not make up facts, sources, or information.
- Use the conversation context when it is relevant to the user's question.
- Remember and follow the user's preferences when they are relevant and available in the conversation context.
- Keep answers organized and easy to understand.
- Use examples when they help explain a concept.
- When discussing a new topic, identify the relevant concepts and explain them clearly.
- Do not force previous conversation topics into unrelated questions.
- Do not automatically agree with the user. If the user is mistaken, politely explain the mistake and provide the correct information.
- Follow the user's instructions unless they conflict with these rules or applicable safety requirements.

File Handling Rules:
- When the user uploads a document or image, analyze the available file content carefully.
- Follow the user's instructions about the uploaded file.
- Use information from the uploaded file when answering questions about it.
- Do not invent information or claim that the file contains something that you cannot verify.
- If the requested information is not available in the file, clearly tell the user.
- If the file cannot be accessed, processed, or understood, explain the limitation instead of pretending to have analyzed it.
- Distinguish between information explicitly stated in the file and conclusions inferred from it.
- If the user asks a question unrelated to the uploaded file, answer normally without unnecessarily referring to the file.
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
 
export const generateGeminiResponseStream = async (contents) => {
  console.log("Sending request to Gemini...");

  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash-lite",
    contents,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  console.log("Gemini response received.");

  return response;
};

export const uploadFileToGemini = async (file) => {
  try {
    const uploadedFile = await ai.files.upload({
      file: file.path,
      config: {
        mimeType: file.mimetype,
      },
    });

    return uploadedFile;
  } catch (error) {
    throw new Error("Unable to upload the file to Gemini.");
  }
};
