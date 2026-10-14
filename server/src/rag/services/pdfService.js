import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

export const extractTextFromPDFService = async (filePath) => {
  let parser;
  try {
    const fileBuffer = await readFile(filePath);
    parser = new PDFParse({
      data: new Uint8Array(fileBuffer),
    });

    const result = await parser.getText();
    const extractedText = result.text?.trim();

    if (!extractedText)
      throw new Error(
        "No text found in the PDF. It may be scanned or image-based",
      );

    return extractedText;
  } catch (err) {
    console.error("PDF extraction failed: ", err.message);
    throw err;
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
};
