import { extractTextFromPDFService } from "./pdfService.js";
import { splitTextIntoChunksService } from "./chunkServices.js";
import { generateDocumentEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const storePDFInChromaService = async ({
  filePath,
  documentId,
  userId,
  conversationId,
  fileName,
}) => {
  if (!filePath || !documentId || !userId || !conversationId)
    throw new Error("Required document information is missing");

  console.log("Extracting PDF text...");

  //STEP-1 Extract text from PDF
  const extractedText = await extractTextFromPDFService(filePath);
  console.log("PDF text extracted successfully");

  //STEP-2 Split text into chunks
  const chunks = splitTextIntoChunksService(extractedText);
  console.log("Total Chunks: ", chunks.length);

  //STEP-3 Generate and embedding for each chunk
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Generating embedding ${i + 1}/${chunks.length}...`);

    const embedding = await generateDocumentEmbeddingService(chunks[i]);
    embeddings.push(embedding);
  }

  //STEP 4 Get the vectordb collection
  const collection = await getDocumentCollectionService();

  //STEP 5 Prepare unique IDs for each chunk
  const ids = [];
  for (let i = 0; i < chunks.length; i++) {
    ids.push(`document=${documentId}-chunk-${i}`);
  }

  const metadatas = [];

  for (let i = 0; i < chunks.length; i++) {
    metadatas.push({
      documentId: String(documentId),
      userId: String(userId),
      conversationId: String(conversationId),
      fileName: fileName || "Unknown PDF",
      chunkIndex: i,
    });
  }
  await collection.add({
    ids,
    documents: chunks,
    embeddings,
    metadatas,
  });
  console.log("PDF chunks stored successfully in ChromaDB");

  return { documentId, totalChunks: chunks.length };
};

import { generateQueryEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({
  question,
  userId,
  conversationId,
  topK = 5,
}) => {
  if (!question?.trim()) throw new Error("Question cannot be empty");

  if (!userId || !conversationId)
    throw new Error("User Id and Conversation Id are required");

  //STEP-1 Convert the user's question into an embedding
  const queryEmbedding = await generateQueryEmbeddingService(question);

  //STEP-2 Get the Vector db collection
  const collection = await getDocumentCollectionService();

  //STEP-3 Search for similar chunks
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: {
      $and: [
        {
          userId: String(userId),
        },
        {
          conversationId: String(conversationId),
        },
      ],
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
