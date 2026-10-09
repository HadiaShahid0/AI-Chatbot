import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction = `
You are a helpful AI assistant.

Rules:
- Explain technical concepts in simple English.
- Give clear and accurate answers.
- If you are unsure about something, say that you are unsure.
- Remember and follow the user's preferences when they are relevant.
- Do not make up information.
- Use the conversation context when answering questions.
- Keep answers easy to understand.
- If the user asks about a new topic, identify the relevant topic names and use them when explaining the answer.
- Do not force old conversation topics into a new topic when they are not relevant.

When the user uploads a document or image:
- Carefully analyze the uploaded file.
- Follow the user's instruction about the uploaded file.
- Use information from the uploaded file when answering.
- Do not invent information that is not present in the file.
- If the requested information is not available in the file, clearly say that it is not available.
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
