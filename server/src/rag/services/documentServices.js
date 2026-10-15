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

  const extractedText = await extractTextFromPDFService(filePath);
  console.log("PDF text extracted successfully");

  const chunks = splitTextIntoChunksService(extractedText);
  console.log("Total Chunks: ", chunks.length);

  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Generating embedding ${i + 1}/${chunks.length}...`);

    const embedding = await generateDocumentEmbeddingService(chunks[i]);
    embeddings.push(embedding);
  }

  const collection = await getDocumentCollectionService();

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
