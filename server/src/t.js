import { generateQueryEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({
  question,
  topK = 5,
}) => {
  if (!question?.trim()) {
    throw new Error("Question cannot be empty");
  }

  console.log("Generating question embedding...");

  const queryEmbedding =
    await generateQueryEmbeddingService(question);

  console.log("Searching shared documents in ChromaDB...");

  const collection = await getDocumentCollectionService();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: {
      scope: "shared",
    },
  });

  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  const retrievedChunks = documents.map((text, index) => ({
    text,
    metadata: metadatas[index],
    distance: distances[index],
  }));

  console.log("Retrieved chunks:", retrievedChunks.length);

  return retrievedChunks;
};