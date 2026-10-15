import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL = "gemini-embedding-001";

export const generateDocumentEmbeddingService = async (text) => {
  if (!text?.trim()) throw new Error("Document text cannot be empty");

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding?.length)
    throw new Error("Failed to generate document embedding");

  return embedding;
};

export const generateQueryEmbeddingService = async (question) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: question,
    config: {
      taskType: "RETRIEVAL_QUERY",
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding?.length)
    throw new Error("Failed to generate question embedding");

  return embedding;
};
