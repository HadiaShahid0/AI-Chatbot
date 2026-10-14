import { extractTextFromPDFService } from "./pdfService.js";
import { splitTextIntoChunksService } from "./chunkServices.js";
import { generateDocumentEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const storePDFInChromaService = async ({
  filePath,
  documentId,
  fileName,
}) => {
  if (!filePath || !documentId)
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
      fileName: fileName || "Unknown PDF",
      chunkIndex: i,
      scope:"shared"
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
