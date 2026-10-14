import { retrieveRelevantChunksService } from "../services/retrievalService.js";

const question = "What information is provided in this document?";

const results = await retrieveRelevantChunksService({
  question,
  userId: 1,
  conversationId: 1,
  topK: 5,
});

console.log("\nQuestion:", question);
console.log("\nRetrieved Chunks:");

results.forEach((chunk, index) => {
  console.log(`\nChunk ${index + 1}:`);
  console.log(chunk.text);
  console.log("Distance:", chunk.distance);
});