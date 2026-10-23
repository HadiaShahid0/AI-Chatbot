import path from "path";
import { fileURLToPath } from "url";
import { extractTextFromPDFService } from "./services/pdfService.js";
import { splitTextIntoChunksService } from "./services/chunkServices.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the PDF file path
const filePath = path.join(__dirname, "documents", "resume.pdf");

// Extract text and test chunking
const text = await extractTextFromPDFService(filePath);

const chunks = splitTextIntoChunksService(text, 1000, 150);

console.log("Total chunks:", chunks.length);

chunks.forEach((chunk, index) => {
  console.log(`\n========== CHUNK ${index + 1} ==========`);
  console.log(chunk);
  console.log("Chunk length:", chunk.length);
});