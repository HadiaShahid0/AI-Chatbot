import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


export const cleanPDFTextService = (text) => {
  if (!text?.trim()) {
    throw new Error("PDF text cannot be empty");
  }

  let cleanedText = text;
  cleanedText = cleanedText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "");
  cleanedText = cleanedText.replace(/[^\S\n]+/g, " ");
  cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n");
  cleanedText = cleanedText.trim();
  return cleanedText;
};


export const splitTextIntoChunksService = async (
  text,
  chunkSize = 1000,
  overlap = 200
) => {
  if (!text?.trim()) throw new Error("Text cannot be empty");

  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) throw new Error("Invalid chunk size or overlap");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
    separators: ["\n\n", "\n", " ", ""],
  });

  return await splitter.splitText(text);
};

// export const splitTextIntoChunksService = (text, chunkSize = 1000, overlap = 200) => {

//   if (!text?.trim()) throw new Error("Text cannot be empty");

//   if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize)
//     throw new Error("Invalid chunk size or overlap");

//   const chunks = [];
//   let start = 0;

//   while (start < text.length) {
//     const end = Math.min(start + chunkSize, text.length);
//     const chunk = text.slice(start, end).trim();

//     if (chunk) chunks.push(chunk);

//     if (end === text.length) break;

//     start = end - overlap;
//   }
//   return chunks;
// };

