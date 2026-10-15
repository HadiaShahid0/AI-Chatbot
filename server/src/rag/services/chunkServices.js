export const splitTextIntoChunksService = (text, chunkSize = 512, overlap = 50) => {

  if (!text?.trim()) throw new Error("Text cannot be empty");

  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize)
    throw new Error("Invalid chunk size or overlap");

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);

    if (end === text.length) break;

    start = end - overlap;
  }
  return chunks;
};
