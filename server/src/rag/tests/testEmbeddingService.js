import "dotenv/config";

import {
  generateDocumentEmbedding,
  generateQueryEmbedding,
} from "../embeddingService.js";

const testEmbedding = async () => {
  try {
    const documentText =
      "RAG stands for Retrieval-Augmented Generation. It retrieves relevant information and provides it to an AI model to generate an answer.";

    const question = "What does RAG mean?";

    console.log("Generating document embedding...");

    const documentEmbedding = await generateDocumentEmbedding(documentText);

    console.log("Document embedding dimensions:", documentEmbedding.length);

    console.log("\nGenerating question embedding...");

    const queryEmbedding = await generateQueryEmbedding(question);

    console.log("Question embedding dimensions:", queryEmbedding.length);

    console.log("\nEmbedding test completed successfully.");
  } catch (error) {
    console.error("Embedding test failed:", error.message);
    process.exitCode = 1;
  }
};

testEmbedding();
