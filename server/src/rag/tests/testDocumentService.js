import "dotenv/config.js";
import { storePDFInChroma } from "../documentServices.js";

const testDocumentService = async () => {
  try {
    const result = await storePDFInChroma({
      filePath: "src/uploads/chat/LLM.pdf",

      documentId: "test-001",
      userId: "test-user-001",
      conversationId: "test-conversation-001",

      fileName: "LLM.pdf",
    });

    console.log("\nDocument ingestion completed:");
    console.log(result);
  } catch (error) {
    console.error("Document ingestion failed:", error.message);
    process.exitCode = 1;
  }
};

testDocumentService();
