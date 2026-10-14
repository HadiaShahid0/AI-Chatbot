import "dotenv/config";

import { extractTextFromPDF } from "../pdfService.js";
import { splitTextIntoChunks } from "../chunkServices.js";

const testPDFService = async () => {
  try {
    // Replace this with the path to a real PDF on your computer.
    const filePath = "src/uploads/chat/LLM.pdf";

    console.log("Extracting PDF text...");

    const extractedText = await extractTextFromPDF(filePath);

    console.log("\nExtracted text preview:");
    console.log(extractedText.slice(0, 500));

    console.log("\nSplitting text into chunks...");

    const chunks = splitTextIntoChunks(extractedText);

    console.log("Total chunks:", chunks.length);

    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(chunk);
    });

    console.log("\nPDF extraction and chunking completed successfully.");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  }
};

testPDFService();
