import { getRelevantDocumentChunksService } from "./toolService.js";

export const searchDocuments = async ({ question }) => {
  const chunks = await getRelevantDocumentChunksService(question, 5);
  return chunks.map((chunk) => ({
    text: chunk.text,
    fileName: chunk.metadata?.fileName,
  }));
};
