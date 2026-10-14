import "dotenv/config";

import { retrieveRelevantChunksService } from "../retrievalService.js";

const testRetrievalService = async () => {
  try {
    const question = "What is an LLM, and how does it work?";

    console.log("Question:", question);
    console.log("\nSearching ChromaDB...");

    const results = await retrieveRelevantChunksService({
      question,

      // These must match the metadata used during ingestion.
      userId: "test-user-001",
      conversationId: "test-conversation-001",

      topK: 5,
    });

    if (results.length === 0) {
      console.log("No relevant chunks found.");
      return;
    }

    console.log(`\nRetrieved ${results.length} chunks:\n`);

    results.forEach((result, index) => {
      console.log(`--- Chunk ${index + 1} ---`);
      console.log("Text:", result.text);
      console.log("Metadata:", result.metadata);
      console.log("Distance:", result.distance);
      console.log();
    });
  } catch (error) {
    console.error("Retrieval failed:", error.message);
    process.exitCode = 1;
  }
};

testRetrievalService();
