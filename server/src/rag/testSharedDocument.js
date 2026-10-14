import { getDocumentCollectionService } from "./services/vectorStoreServices.js";

const collection = await getDocumentCollectionService();

const results = await collection.get({
  include: ["metadatas"],
});

console.log("Total stored records:", results.ids.length);

console.log("Stored IDs:", results.ids);

console.log("Stored metadata:", results.metadatas);