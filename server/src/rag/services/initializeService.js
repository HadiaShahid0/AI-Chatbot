import { getDocumentCollectionService } from "./vectorStoreServices.js";
import { buildKeywordIndexService } from "./keywordSearchService.js";

export const initializeHybridSearchService = async () => {
  try {
    console.log("Initializing BM25 keyword index");
    const collection = await getDocumentCollectionService();
    const storedDocuments = await collection.get({
      where: { scope: "shared" },
      include: ["documents", "metadatas"],
    });
    const chunks = (storedDocuments.documents || [])
      .map((text, index) => ({
        id: storedDocuments.ids[index],
        text,
        metadata: storedDocuments.metadata?.[index] || {},
      }))
      .filter((chunk) => chunk.text);
    buildKeywordIndexService(chunks);
    console.log(`BM25 keyword index initialized with ${chunks.length} chunks`);
  } catch (error) {
    console.log("Failed to initialize BM25 keyword index", error);
    throw error;
  }
};
