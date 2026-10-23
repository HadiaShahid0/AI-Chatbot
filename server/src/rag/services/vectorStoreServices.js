import { ChromaClient } from "chromadb";

const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

let documentCollection = null;

export const getDocumentCollectionService = async () => {
  if (documentCollection) {
    return documentCollection;
  }

  documentCollection = await chroma.getOrCreateCollection({
    name: "chatDocuments",
    embeddingFunction: null,
    metadata: { "hnsw:space": "cosine" }
  });

  return documentCollection;
};

export const checkChromaConnection = async () => {
  await chroma.heartbeat();

  console.log("ChromaDB connected successfully.");
};

export default chroma;
