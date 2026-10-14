import path from "path";
import { fileURLToPath } from "url";
import { storePDFInChromaService } from "./services/documentServices.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "documents", "resume.pdf");

const result = await storePDFInChromaService({
  filePath,
  documentId: 1,
  fileName: "resume.pdf",
});

console.log(result);