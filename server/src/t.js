// import crypto from "node:crypto";
// import fs from "node:fs/promises";

// export const generateFileHashService = async (filePath) => {
//   const fileBuffer = await fs.readFile(filePath);

//   return crypto.createHash("sha256").update(fileBuffer).digest("hex");
// };

// export const generateTextHashService = (text) => {
//   return crypto.createHash("sha256").update(text).digest("hex");
// };

// import { extractTextFromPDFService } from "./pdfService.js";
// import { splitTextIntoChunksService } from "./chunkServices.js";
// import { generateDocumentEmbeddingService } from "./embeddingService.js";
// import { getDocumentCollectionService } from "./vectorStoreServices.js";

// import {
//   generateFileHashService,
//   generateTextHashService,
// } from "./hashService.js";

// export const storePDFInChromaService = async ({
//   filePath,
//   documentId,
//   fileName,
// }) => {
//   if (!filePath || documentId == null) {
//     throw new Error("Required document information is missing");
//   }

//   const collection = await getDocumentCollectionService();

//   // 1. Generate a hash for the PDF
//   const fileHash = await generateFileHashService(filePath);

//   // 2. Get existing chunks of this document from ChromaDB
//   const existingData = await collection.get({
//     where: {
//       documentId: String(documentId),
//       scope: "shared",
//     },
//     include: ["documents", "metadatas", "embeddings"],
//   });

//   // 3. Skip ingestion if the PDF has not changed
//   if (existingData.ids.length > 0) {
//     const storedFileHash = existingData.metadatas[0]?.fileHash;

//     const isUnchanged = existingData.metadatas.every(
//       (metadata) => metadata.fileHash === fileHash,
//     );

//     if (storedFileHash && isUnchanged) {
//       console.log("PDF has not changed. Skipping ingestion.");

//       return {
//         documentId,
//         status: "unchanged",
//         totalChunks: existingData.ids.length,
//         newEmbeddings: 0,
//       };
//     }
//   }

//   // 4. Extract text and split it into chunks
//   const text = await extractTextFromPDFService(filePath);

//   const chunks = splitTextIntoChunksService(text, 512, 50);

//   // 5. Calculate a hash for each new chunk
//   const newChunks = chunks.map((text, index) => ({
//     text,
//     index,
//     hash: generateTextHashService(text),
//   }));

//   // 6. Find existing chunks and their embeddings
//   const oldChunks = new Map();

//   for (let i = 0; i < existingData.ids.length; i++) {
//     const hash = existingData.metadatas[i]?.chunkHash;
//     const embedding = existingData.embeddings?.[i];

//     if (!hash || !embedding) continue;

//     if (!oldChunks.has(hash)) {
//       oldChunks.set(hash, []);
//     }

//     oldChunks.get(hash).push(Array.from(embedding));
//   }

//   // 7. Prepare data for ChromaDB
//   const ids = [];
//   const documents = [];
//   const embeddings = [];
//   const metadatas = [];

//   let reusedEmbeddings = 0;
//   let newEmbeddings = 0;

//   for (const chunk of newChunks) {
//     const id = `document=${documentId}-chunk-${chunk.index}`;

//     // Reuse the embedding if the same chunk already exists
//     const matchingEmbeddings = oldChunks.get(chunk.hash);

//     let embedding;

//     if (matchingEmbeddings?.length > 0) {
//       embedding = matchingEmbeddings.shift();
//       reusedEmbeddings++;
//     } else {
//       // Generate an embedding for a new or changed chunk
//       embedding = await generateDocumentEmbeddingService(chunk.text);
//       newEmbeddings++;
//     }

//     ids.push(id);
//     documents.push(chunk.text);
//     embeddings.push(embedding);

//     metadatas.push({
//       documentId: String(documentId),
//       fileName: fileName || "Unknown PDF",
//       fileHash,
//       chunkHash: chunk.hash,
//       chunkIndex: chunk.index,
//       scope: "shared",
//     });
//   }

//   // 8. Add new chunks or update existing chunks
//   if (ids.length > 0) {
//     await collection.upsert({
//       ids,
//       documents,
//       embeddings,
//       metadatas,
//     });
//   }

//   // 9. Delete old chunks that are no longer needed
//   const newIds = new Set(ids);

//   const obsoleteIds = existingData.ids.filter((id) => !newIds.has(id));

//   if (obsoleteIds.length > 0) {
//     await collection.delete({
//       ids: obsoleteIds,
//     });
//   }

//   console.log("PDF ingestion completed successfully.");

//   return {
//     documentId,
//     status: existingData.ids.length > 0 ? "updated" : "created",
//     totalChunks: chunks.length,
//     reusedEmbeddings,
//     newEmbeddings,
//     deletedChunks: obsoleteIds.length,
//   };
// };

// export const getRelevantDocumentChunksService = async (question, topK = 5) => {
//   if (!question?.trim()) {
//     return [];
//   }

//   try {
//     // Step 1: Retrieve candidate chunks from ChromaDB
//     const candidateChunks = await retrieveRelevantChunksService({
//       question,
//       topK,
//     });

//     console.log(`Retrieved ${candidateChunks.length} candidate chunks.`);

//     console.log(
//       "Retrieved Chunks:",
//       JSON.stringify(
//         candidateChunks.map((chunk, index) => ({
//           rank: index + 1,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//         })),
//         null,
//         2,
//       ),
//     );

//     if (candidateChunks.length === 0) {
//       console.log("No candidate chunks were retrieved.");
//       return [];
//     }

//     // Step 2: Re-rank the candidate chunks
//     const rerankedChunks = await rerankChunksService({
//       question,
//       chunks: candidateChunks,
//       topK,
//     });

//     console.log(`Re-ranking returned ${rerankedChunks.length} chunks.`);

//     // Step 3: Define the score threshold
//     const threshold = -8;

//     // Step 4: Separate accepted and rejected chunks
//     const acceptedChunks = rerankedChunks.filter((chunk) => {
//       return (
//         typeof chunk.rerankScore === "number" &&
//         Number.isFinite(chunk.rerankScore) &&
//         chunk.rerankScore >= threshold
//       );
//     });

//     const rejectedChunks = rerankedChunks.filter((chunk) => {
//       return (
//         typeof chunk.rerankScore !== "number" ||
//         !Number.isFinite(chunk.rerankScore) ||
//         chunk.rerankScore < threshold
//       );
//     });

//     // Step 5: Display all re-ranked chunks
//     console.log(
//       "Re-ranked Chunks:",
//       JSON.stringify(
//         rerankedChunks.map((chunk, index) => ({
//           rank: index + 1,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//           rerankScore: chunk.rerankScore,
//         })),
//         null,
//         2,
//       ),
//     );

//     // Step 6: Display accepted chunks
//     console.log("\n========== ACCEPTED CHUNKS ==========");
//     console.log(`Accepted: ${acceptedChunks.length}`);

//     console.log(
//       JSON.stringify(
//         acceptedChunks.map((chunk, index) => ({
//           rank: index + 1,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//           rerankScore: chunk.rerankScore,
//           status: "ACCEPTED",
//         })),
//         null,
//         2,
//       ),
//     );

//     // Step 7: Display rejected chunks
//     console.log("\n========== REJECTED CHUNKS ==========");
//     console.log(`Rejected: ${rejectedChunks.length}`);

//     console.log(
//       JSON.stringify(
//         rejectedChunks.map((chunk, index) => ({
//           rank: index + 1,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//           rerankScore: chunk.rerankScore,
//           status: "REJECTED",
//         })),
//         null,
//         2,
//       ),
//     );

//     // Step 8: Display threshold statistics
//     console.log("\n========== THRESHOLDING SUMMARY ==========");
//     console.log(`Score threshold: ${threshold}`);
//     console.log(`Chunks before thresholding: ${rerankedChunks.length}`);
//     console.log(`Chunks accepted: ${acceptedChunks.length}`);
//     console.log(`Chunks rejected: ${rejectedChunks.length}`);

//     // Step 9: Return only accepted chunks
//     return acceptedChunks;
//   } catch (error) {
//     console.error("Document retrieval failed:", error);
//     return [];
//   }
// };

// const cosineSimilarity = (vectorA, vectorB) => {
//   let dotProduct = 0;
//   let magnitudeA = 0;
//   let magnitudeB = 0;

//   for (let i = 0; i < vectorA.length; i++) {
//     dotProduct += vectorA[i] * vectorB[i];

//     magnitudeA += vectorA[i] ** 2;
//     magnitudeB += vectorB[i] ** 2;
//   }

//   const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

//   if (denominator === 0) {
//     return 0;
//   }

//   return dotProduct / denominator;
// };

// export const selectChunksWithMMRService = ({
//   questionEmbedding,
//   chunks,
//   topK = 5,
//   lambda = 0.7,
// }) => {
//   if (!chunks?.length || !questionEmbedding?.length) {
//     return [];
//   }

//   const remainingChunks = [...chunks];
//   const selectedChunks = [];

//   while (selectedChunks.length < topK && remainingChunks.length > 0) {
//     let bestIndex = 0;
//     let bestScore = -Infinity;

//     for (let i = 0; i < remainingChunks.length; i++) {
//       const candidate = remainingChunks[i];

//       // Similarity between the question and candidate chunk
//       const relevance = cosineSimilarity(
//         questionEmbedding,
//         candidate.embedding,
//       );

//       // Similarity between candidate and already selected chunks
//       let redundancy = 0;

//       for (const selected of selectedChunks) {
//         const similarity = cosineSimilarity(
//           candidate.embedding,
//           selected.embedding,
//         );

//         redundancy = Math.max(redundancy, similarity);
//       }

//       // MMR formula
//       const mmrScore = lambda * relevance - (1 - lambda) * redundancy;

//       if (mmrScore > bestScore) {
//         bestScore = mmrScore;
//         bestIndex = i;
//       }
//     }

//     const [selectedChunk] = remainingChunks.splice(bestIndex, 1);

//     selectedChunks.push(selectedChunk);

//     console.log("MMR selected chunk:", {
//       text: selectedChunk.text,
//       mmrScore: bestScore,
//     });
//   }

//   return selectedChunks;
// };

// export const rewriteQueryService = async (question, history = "") => {
//   const response = await ai.models.generateContent({
//     model: "gemini-3.5-flash-lite",
//     contents: `
// Rewrite the user's question to improve document retrieval.

// Rules:
// - Preserve the original meaning.
// - Use relevant keywords from the conversation history.
// - Resolve references such as "it", "that project", and "those technologies"
//   when the history makes their meaning clear.
// - Do not answer the question.
// - Do not invent facts.
// - Return only the rewritten search query.

// Conversation history:
// ${history}

// Original question:
// ${question}
// `,
//   });

//   return response.text.trim();
// };

// // Convert text into searchable words.
// const tokenizeText = (text) => {
//   return text
//     .toLowerCase()
//     .replace(/[^\p{L}\p{N}]+/gu, " ")
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
// };

// // Calculate BM25 scores for document chunks.
// export const searchChunksWithBM25Service = (question, chunks, topK = 10) => {
//   const queryTerms = tokenizeText(question);

//   if (!queryTerms.length || !chunks.length) {
//     return [];
//   }

//   // Prepare each chunk for keyword search.
//   const documents = chunks.map((chunk) => {
//     const tokens = tokenizeText(chunk.text);
//     const termFrequencies = new Map();

//     for (const token of tokens) {
//       termFrequencies.set(token, (termFrequencies.get(token) || 0) + 1);
//     }

//     return {
//       ...chunk,
//       tokens,
//       termFrequencies,
//       length: tokens.length,
//     };
//   });

//   const totalDocuments = documents.length;

//   const averageLength =
//     documents.reduce((total, document) => {
//       return total + document.length;
//     }, 0) / totalDocuments;

//   // Count how many documents contain each query term.
//   const documentFrequency = new Map();

//   for (const term of new Set(queryTerms)) {
//     let count = 0;

//     for (const document of documents) {
//       if (document.termFrequencies.has(term)) {
//         count++;
//       }
//     }

//     documentFrequency.set(term, count);
//   }

//   const k1 = 1.5;
//   const b = 0.75;

//   // Calculate the BM25 score for every chunk.
//   const scoredChunks = documents.map((document) => {
//     let score = 0;

//     for (const term of queryTerms) {
//       const termFrequency = document.termFrequencies.get(term) || 0;

//       if (termFrequency === 0) {
//         continue;
//       }

//       const documentCount = documentFrequency.get(term) || 0;

//       const inverseDocumentFrequency = Math.log(
//         1 + (totalDocuments - documentCount + 0.5) / (documentCount + 0.5),
//       );

//       const lengthNormalization =
//         k1 * (1 - b + (b * document.length) / (averageLength || 1));

//       const termScore =
//         (termFrequency * (k1 + 1)) / (termFrequency + lengthNormalization);

//       score += inverseDocumentFrequency * termScore;
//     }

//     // Remove temporary keyword-search data.
//     const { tokens, termFrequencies, length, ...chunk } = document;

//     return {
//       ...chunk,
//       keywordScore: score,
//     };
//   });

//   // Highest BM25 score comes first.
//   return scoredChunks
//     .filter((chunk) => chunk.keywordScore > 0)
//     .sort((a, b) => b.keywordScore - a.keywordScore)
//     .slice(0, topK);
// };

// export const searchChunksByKeywordService = (question, chunks, topK = 10) => {
//   if (!question?.trim() || !chunks.length) {
//     return [];
//   }

//   // Convert the question into individual words.
//   const questionWords = question.toLowerCase().split(/\s+/).filter(Boolean);

//   // Calculate the keyword score for each chunk.
//   const scoredChunks = chunks.map((chunk) => {
//     const chunkText = chunk.text.toLowerCase();

//     let keywordScore = 0;

//     for (const word of questionWords) {
//       if (chunkText.includes(word)) {
//         keywordScore++;
//       }
//     }

//     return {
//       ...chunk,
//       keywordScore,
//     };
//   });

//   // Keep chunks that contain at least one matching word.
//   const matchedChunks = scoredChunks.filter((chunk) => chunk.keywordScore > 0);

//   // Sort chunks by their keyword scores.
//   matchedChunks.sort(
//     (chunkA, chunkB) => chunkB.keywordScore - chunkA.keywordScore,
//   );

//   // Return the highest-ranking chunks.
//   return matchedChunks.slice(0, topK);
// };

// import bm25 from "wink-bm25-text-search";

// // Store the BM25 search engine.
// let keywordSearchEngine = null;

// // Store chunks so we can retrieve their original text and metadata.
// let chunksById = new Map();

// // Convert text into searchable words.
// const prepareText = (text) => {
//   return text.toLowerCase().match(/[\p{L}\p{N}_.-]+/gu) || [];
// };

// // Build or rebuild the keyword index.
// export const buildKeywordIndexService = (chunks) => {
//   // Create a new search engine.
//   const engine = bm25();

//   // Tell BM25 which field contains the searchable text.
//   engine.defineConfig({
//     fldWeights: {
//       text: 1,
//     },
//   });

//   // Prepare text before indexing and searching.
//   engine.definePrepTasks([prepareText]);

//   // Reset the chunk lookup.
//   chunksById = new Map();

//   // Add each document chunk to the index.
//   chunks.forEach((chunk) => {
//     engine.addDoc(
//       {
//         text: chunk.text,
//       },
//       chunk.id,
//     );

//     chunksById.set(chunk.id, chunk);
//   });

//   // Prepare the index for searching.
//   engine.consolidate();

//   keywordSearchEngine = engine;

//   console.log(`BM25 indexed ${chunks.length} chunks.`);
// };

// // Search document chunks using BM25.
// export const searchKeywordChunksService = (question, topK = 10) => {
//   if (!question?.trim()) {
//     return [];
//   }

//   if (!keywordSearchEngine) {
//     throw new Error("BM25 keyword index has not been initialized.");
//   }

//   // Search returns [documentId, relevanceScore] pairs.
//   const results = keywordSearchEngine.search(question, topK);

//   // Return the original chunks with their keyword scores.
//   return results
//     .map(([id, score]) => {
//       const chunk = chunksById.get(id);

//       if (!chunk) {
//         return null;
//       }

//       return {
//         ...chunk,
//         keywordScore: score,
//       };
//     })
//     .filter(Boolean);
// };

// import { searchKeywordChunksService } from "./keywordService.js";
// import { retrieveRelevantChunksService } from "./vectorService.js";

// const RRF_CONSTANT = 60;

// /**
//  * Combines vector search and BM25 keyword search using RRF.
//  */
// export const hybridSearchService = async ({ question, topK = 5 }) => {
//   if (!question?.trim()) {
//     throw new Error("Question cannot be empty");
//   }

//   // 1. Run both searches simultaneously.
//   const [keywordResults, vectorResults] = await Promise.all([
//     searchKeywordChunksService(question, topK * 2),

//     retrieveRelevantChunksService({
//       question,
//       topK: topK * 2,
//     }),
//   ]);

//   // 2. Store and combine the search results.
//   const fusedItems = new Map();

//   const addSearchResults = (results, searchType) => {
//     results.forEach((item, index) => {
//       if (!item.id) {
//         console.warn("Search result is missing an ID:", item);
//         return;
//       }

//       const itemId = item.id;
//       const rank = index + 1;

//       // Create an entry if this chunk has not been seen.
//       if (!fusedItems.has(itemId)) {
//         fusedItems.set(itemId, {
//           ...item,
//           rrfScore: 0,
//           vectorRank: null,
//           keywordRank: null,
//         });
//       }

//       const fusedItem = fusedItems.get(itemId);

//       // Save the rank from the relevant search.
//       if (searchType === "vector") {
//         fusedItem.vectorRank = rank;
//       } else {
//         fusedItem.keywordRank = rank;
//       }

//       // Add the RRF score for this ranking.
//       fusedItem.rrfScore += 1 / (RRF_CONSTANT + rank);
//     });
//   };

//   // 3. Combine the rankings.
//   addSearchResults(keywordResults, "keyword");
//   addSearchResults(vectorResults, "vector");

//   // 4. Sort by the combined RRF score.
//   const hybridResults = Array.from(fusedItems.values())
//     .sort((a, b) => b.rrfScore - a.rrfScore)
//     .slice(0, topK);

//   // 5. Log the results for debugging.
//   console.log("\n========== HYBRID SEARCH ==========");
//   console.log("Question:", question);
//   console.log("Keyword results:", keywordResults.length);
//   console.log("Vector results:", vectorResults.length);
//   console.log("Final hybrid results:", hybridResults.length);

//   console.table(
//     hybridResults.map((item) => ({
//       id: item.id,
//       vectorRank: item.vectorRank,
//       keywordRank: item.keywordRank,
//       rrfScore: item.rrfScore,
//       fileName: item.metadata?.fileName,
//     })),
//   );

//   return hybridResults;
// };

// import { hybridSearchService } from "./hybridSearchService.js";

// export const getRelevantDocumentChunksServic = async (question, topK = 5) => {
//   if (!question?.trim()) {
//     return [];
//   }

//   try {
//     // Step 1: Retrieve chunks using hybrid search (BM25 + vector search + RRF).
//     // Retrieve more candidates so the re-ranker has more chunks to evaluate.
//     const candidateChunks = await hybridSearchService({
//       question,
//       topK: topK * 2,
//     });

//     console.log(
//       `Retrieved ${candidateChunks.length} hybrid search candidate chunks.`,
//     );

//     console.log(
//       JSON.stringify(
//         candidateChunks.map((chunk, index) => ({
//           rank: index + 1,
//           id: chunk.id,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//           vectorRank: chunk.vectorRank,
//           keywordRank: chunk.keywordRank,
//           rrfScore: chunk.rrfScore,
//         })),
//         null,
//         2,
//       ),
//     );

//     if (candidateChunks.length === 0) {
//       return [];
//     }

//     // Step 2: Re-rank the hybrid search results.
//     const rerankedChunks = await rerankChunksService({
//       question,
//       chunks: candidateChunks,
//       topK,
//     });

//     // Step 3: Keep chunks whose re-ranking score meets the threshold.
//     const threshold = -8;

//     const relevantChunks = rerankedChunks.filter((chunk) => {
//       return chunk.rerankScore >= threshold;
//     });

//     const rejectedChunks = rerankedChunks.filter((chunk) => {
//       return chunk.rerankScore < threshold;
//     });

//     console.log(`Re-ranking returned ${rerankedChunks.length} chunks.`);

//     // Step 4: Display accepted chunks.
//     console.log("\n========== ACCEPTED CHUNKS ==========");
//     console.log(`Accepted: ${relevantChunks.length}`);

//     console.log(
//       JSON.stringify(
//         relevantChunks.map((chunk, index) => ({
//           rank: index + 1,
//           id: chunk.id,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//           vectorRank: chunk.vectorRank,
//           keywordRank: chunk.keywordRank,
//           rrfScore: chunk.rrfScore,
//           rerankScore: chunk.rerankScore,
//           status: "ACCEPTED",
//         })),
//         null,
//         2,
//       ),
//     );

//     // Step 5: Display rejected chunks.
//     console.log("\n========== REJECTED CHUNKS ==========");
//     console.log(`Rejected: ${rejectedChunks.length}`);

//     console.log(
//       JSON.stringify(
//         rejectedChunks.map((chunk, index) => ({
//           rank: index + 1,
//           id: chunk.id,
//           text: chunk.text,
//           metadata: chunk.metadata,
//           distance: chunk.distance,
//           rrfScore: chunk.rrfScore,
//           rerankScore: chunk.rerankScore,
//           status: "REJECTED",
//         })),
//         null,
//         2,
//       ),
//     );

//     // Step 6: Display threshold statistics.
//     console.log(`Score threshold: ${threshold}`);
//     console.log(`Chunks before thresholding: ${rerankedChunks.length}`);
//     console.log(`Chunks after thresholding: ${relevantChunks.length}`);
//     console.log(`Chunks rejected: ${rejectedChunks.length}`);

//     return relevantChunks;
//   } catch (error) {
//     console.error("Document retrieval failed:", error);
//     return [];
//   }
// };


import { getDocumentCollectionService } from "./vectorStoreServices.js";
import { buildKeywordIndexService } from "./keywordSearchService.js";

export const initializeHybridSearchService = async () => {
  try {
    console.log("Initializing BM25 keyword index...");

    // Step 1: Get the ChromaDB collection.
    const collection = await getDocumentCollectionService();

    // Step 2: Get all shared document chunks from ChromaDB.
    const storedDocuments = await collection.get({
      where: {
        scope: "shared",
      },
      include: ["documents", "metadatas"],
    });

    // Step 3: Prepare the chunks for BM25.
    const chunks = (storedDocuments.documents || [])
      .map((text, index) => ({
        id: storedDocuments.ids[index],
        text,
        metadata: storedDocuments.metadatas?.[index] || {},
      }))
      .filter((chunk) => chunk.text);

    // Step 4: Build the BM25 index.
    buildKeywordIndexService(chunks);

    console.log(
      `BM25 keyword index initialized with ${chunks.length} chunks.`,
    );
  } catch (error) {
    console.error("Failed to initialize BM25 keyword index:", error);
    throw error;
  }
};


import { generateQueryEmbeddingService } from "./embeddingService.js";
import { getDocumentCollectionService } from "./vectorStoreServices.js";

export const retrieveRelevantChunksService = async ({
  question,
  topK = 5,
}) => {
  if (!question?.trim()) {
    throw new Error("Question cannot be empty");
  }

  const queryEmbedding = await generateQueryEmbeddingService(question);

  const collection = await getDocumentCollectionService();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: {
      scope: "shared",
    },
  });

  // Extract IDs along with the other search results.
  const ids = results.ids?.[0] || [];
  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  // Build the retrieved chunks.
  const retrievedChunks = documents.map((text, index) => ({
    id: ids[index],
    text,
    metadata: metadatas[index],
    distance: distances[index],
  }));

  console.log("Vector search retrieved:", retrievedChunks.length);

  return retrievedChunks;
};


const chunks = (storedDocuments.documents || [])
  .map((text, index) => ({
    id: storedDocuments.ids[index],
    text,
    metadata: storedDocuments.metadatas?.[index] || {},
  }))
  .filter((chunk) => chunk.text);

buildKeywordIndexService(chunks);


import bm25 from "wink-bm25-text-search";

let keywordSearchEngine = null;
let chunksById = new Map();

const prepareText = (text) => {
  return text.toLowerCase().match(/[\p{L}\p{N}_.-]+/gu) || [];
};

export const buildKeywordIndexService = (chunks) => {
  const engine = bm25();

  engine.defineConfig({
    fldWeights: {
      text: 1,
    },
  });

  engine.definePrepTasks([prepareText]);

  chunksById = new Map();

  chunks.forEach((chunk) => {
    engine.addDoc(
      {
        text: chunk.text,
      },
      chunk.id,
    );

    chunksById.set(chunk.id, chunk);
  });

  engine.consolidate();

  keywordSearchEngine = engine;

  console.log(`BM25 indexed ${chunks.length} chunks`);
};

export const searchKeywordChunksService = (question, topK = 7) => {
  if (!question?.trim()) return [];

  if (!keywordSearchEngine) {
    throw new Error("BM25 keyword index has not been initialized");
  }

  // Perform BM25 keyword search
  const results = keywordSearchEngine.search(question, topK);

  // Convert BM25 results into readable chunk objects
  const keywordResults = results
    .map(([id, score]) => {
      const chunk = chunksById.get(id);

      if (!chunk) return null;

      return {
        ...chunk,
        keywordScore: score,
      };
    })
    .filter(Boolean);

  // Log keyword search details
  console.log("\n========== BM25 KEYWORD SEARCH ==========");
  console.log("Question:", question);
  console.log("Requested topK:", topK);
  console.log("Results found:", keywordResults.length);

  console.table(
    keywordResults.map((chunk, index) => ({
      rank: index + 1,
      id: chunk.id,
      keywordScore: chunk.keywordScore,
      fileName: chunk.metadata?.fileName,
      chunkIndex: chunk.metadata?.chunkIndex,
    })),
  );

  keywordResults.forEach((chunk, index) => {
    console.log(`\n--- Keyword Result ${index + 1} ---`);
    console.log("ID:", chunk.id);
    console.log("BM25 Score:", chunk.keywordScore);
    console.log("Metadata:", chunk.metadata);
    console.log("Text:", chunk.text);
  });

  console.log("========== END BM25 KEYWORD SEARCH ==========\n");

  return keywordResults;
};




const addSearchResults = (results, searchType) => {
  results.forEach((item, index) => {
    if (!item.id) {
      console.warn("Search result is missing an ID", item);
      return;
    }

    const itemId = item.id;
    const rank = index + 1;

    if (!fusedItems.has(itemId)) {
      fusedItems.set(itemId, {
        ...item,
        metadata: item.metadata || {},
        rrfScore: 0,
        vectorRank: null,
        keywordRank: null,
      });
    }

    const fusedItem = fusedItems.get(itemId);

    // Merge metadata from both search results.
    fusedItem.metadata = {
      ...fusedItem.metadata,
      ...(item.metadata || {}),
    };

    // Preserve other useful fields if missing.
    if (!fusedItem.text && item.text) {
      fusedItem.text = item.text;
    }

    if (searchType === "vector") {
      fusedItem.vectorRank = rank;
    } else {
      fusedItem.keywordRank = rank;
    }

    fusedItem.rrfScore += 1 / (K + rank);
  });
};



export const calculatePrecisionAtK = (
  retrievedChunkIds,
  relevantChunkIds,
) => {
  if (retrievedChunkIds.length === 0) {
    return 0;
  }

  const relevantIds = new Set(relevantChunkIds);

  const relevantRetrievedChunks = retrievedChunkIds.filter((chunkId) =>
    relevantIds.has(chunkId),
  );

  return relevantRetrievedChunks.length / retrievedChunkIds.length;
};

export const calculateRecallAtK = (
  retrievedChunkIds,
  relevantChunkIds,
) => {
  // Recall is undefined when there are no known relevant chunks.
  if (relevantChunkIds.length === 0) {
    return null;
  }

  const relevantIds = new Set(relevantChunkIds);

  const relevantRetrievedChunks = retrievedChunkIds.filter((chunkId) =>
    relevantIds.has(chunkId),
  );

  return relevantRetrievedChunks.length / relevantIds.size;
};

export const calculateReciprocalRank = (
  retrievedChunkIds,
  relevantChunkIds,
) => {
  const relevantIds = new Set(relevantChunkIds);

  const firstRelevantIndex = retrievedChunkIds.findIndex((chunkId) =>
    relevantIds.has(chunkId),
  );

  if (firstRelevantIndex === -1) {
    return 0;
  }

  const rank = firstRelevantIndex + 1;

  return 1 / rank;
};

export const evaluateRetrievalService = (
  retrievedChunks,
  relevantChunkIds,
) => {
  const retrievedChunkIds = retrievedChunks.map((chunk) => chunk.id);

  const relevantIds = new Set(relevantChunkIds);

  const relevantRetrievedCount = retrievedChunkIds.filter((chunkId) =>
    relevantIds.has(chunkId),
  ).length;

  return {
    retrievedCount: retrievedChunkIds.length,
    relevantCount: relevantIds.size,
    relevantRetrievedCount,

    precision: calculatePrecisionAtK(
      retrievedChunkIds,
      relevantChunkIds,
    ),

    recall: calculateRecallAtK(
      retrievedChunkIds,
      relevantChunkIds,
    ),

    reciprocalRank: calculateReciprocalRank(
      retrievedChunkIds,
      relevantChunkIds,
    ),
  };
};




import { hybridSearchService } from "./services/hybridSearch.js";

import { evaluateRetrievalService } from "./services/ragEvaluationService.js";

import { evaluationDataset } from "./evaluationDataset.js";

const evaluateRag = async () => {
  if (evaluationDataset.length === 0) {
    console.log("Evaluation dataset is empty.");
    return;
  }

  const results = [];

  for (const testCase of evaluationDataset) {
    console.log("\n====================================");
    console.log("Question:", testCase.question);
    console.log("====================================");

    const retrievedChunks = await hybridSearchService(
      testCase.question,
      5,
    );

    const metrics = evaluateRetrievalService(
      retrievedChunks,
      testCase.relevantChunkIds,
    );

    const result = {
      questionId: testCase.id,
      question: testCase.question,
      ...metrics,
    };

    results.push(result);

    console.log("Retrieved chunks:", metrics.retrievedCount);

    console.log("Relevant chunks found:", metrics.relevantRetrievedCount);

    console.log(
      "Precision@5:",
      metrics.precision.toFixed(2),
    );

    console.log(
      "Recall@5:",
      metrics.recall === null
        ? "Not available"
        : metrics.recall.toFixed(2),
    );

    console.log(
      "Reciprocal Rank:",
      metrics.reciprocalRank.toFixed(2),
    );
  }

  console.log("\n========== EVALUATION RESULTS ==========");

  console.table(results);

  // Calculate average Precision@5.
  const averagePrecision =
    results.reduce(
      (total, result) => total + result.precision,
      0,
    ) / results.length;

  // Exclude test cases where Recall is not available.
  const averageRecallResults = results.filter(
    (result) => result.recall !== null,
  );

  const averageRecall =
    averageRecallResults.length > 0
      ? averageRecallResults.reduce(
          (total, result) => total + result.recall,
          0,
        ) / averageRecallResults.length
      : null;

  // Calculate Mean Reciprocal Rank (MRR).
  const averageMRR =
    results.reduce(
      (total, result) => total + result.reciprocalRank,
      0,
    ) / results.length;

  console.log("\n========== AVERAGE METRICS ==========");

  console.log(
    "Average Precision@5:",
    averagePrecision.toFixed(2),
  );

  console.log(
    "Average Recall@5:",
    averageRecall === null
      ? "Not available"
      : averageRecall.toFixed(2),
  );

  console.log(
    "Mean Reciprocal Rank (MRR):",
    averageMRR.toFixed(2),
  );
};

evaluateRag().catch((error) => {
  console.error("RAG evaluation failed:", error);
});




