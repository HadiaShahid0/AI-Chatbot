import { ChromaClient } from "chromadb";

const client = new ChromaClient({
    host: "localhost",
    port: 8000,
    ssl: false
});

async function inspectCollection() {
    try {
        // Step 1: Display available collections
        const collections = await client.listCollections();

        console.log("\nAvailable collections:");
        console.log(collections);

        // Step 2: Access the expected collection
        const collection = await client.getCollection({
            name: "chatDocuments"
        });

        // Step 3: Get total number of records
        const totalDocs = await collection.count();

        console.log("\nTotal records:", totalDocs);

        // Step 4: Retrieve all records
        const data = await collection.get({
            include: ["documents", "metadatas"]
        });

        // Step 5: Display each record
        for (let i = 0; i < data.ids.length; i++) {
            console.log(`\n--- Record ${i + 1} ---`);

            console.log("ID:", data.ids[i]);
            console.log("File name:", data.metadatas[i]?.fileName);
            console.log("Document ID:", data.metadatas[i]?.documentId);
            console.log("Chunk index:", data.metadatas[i]?.chunkIndex);
            console.log("Scope:", data.metadatas[i]?.scope);
            console.log("Content:", data.documents[i]);
        }

    } catch (error) {
        console.error("Error inspecting collection:", error);
    }
}

inspectCollection();
import chroma from "./services/vectorStoreServices.js";

async function checkSimilarityStrategy() {
  try {
    const collection = await chroma.getCollection({
      name: "chatDocuments",
    });

    console.log("Collection name:", collection.name);
    console.log("Collection metadata:", collection.metadata);

    const configuration = await collection.configuration;

    console.log(
      "Collection configuration:",
      JSON.stringify(configuration, null, 2)
    );

    console.log(
      "HNSW space:",
      configuration?.hnsw?.space
    );
  } catch (error) {
    console.error("Error checking collection:", error);
  }
}

checkSimilarityStrategy();