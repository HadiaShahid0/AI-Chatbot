import "dotenv/config";
import {
  checkChromaConnection,
} from "./services/vectorStoreServices.js";
import chroma from "./services/vectorStoreServices.js";

const testChroma = async () => {
  try {
    await checkChromaConnection();

    // Remove the old collection and its saved configuration.
    try {
      await chroma.deleteCollection({
        name: "chat_documents",
      });

      console.log("Old collection deleted.");
    } catch {
      console.log("No existing collection to delete.");
    }

    // Create a collection without a default embedding function.
    const collection = await chroma.createCollection({
      name: "chat_documents",
      embeddingFunction: null,
    });

    console.log("Collection ready:", collection.name);
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  }
};

testChroma();