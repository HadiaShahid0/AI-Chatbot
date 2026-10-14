import { generateQueryEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({
  question,
  topK = 5,
}) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  //STEP-1 Convert the user's question into an embedding
  const queryEmbedding = await generateQueryEmbeddingService(question);

  //STEP-2 Get the Vector db collection
  const collection = await getDocumentCollectionService();

  //STEP-3 Search for similar chunks
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
  
  return documents.map((text, index) => ({
    text,
    metadata: metadatas[index],
    distance: distances[index],
  }));
};
