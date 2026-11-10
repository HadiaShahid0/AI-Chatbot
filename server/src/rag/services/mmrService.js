// import { similarity } from "ml-distance";

// export const selectChunksWithMMR = ({
//   questionEmbedding,
//   chunks,
//   topK = 3,
//   lambda = 0.7,
// }) => {
//   const selectedChunks = [];
//   const remainingChunks = [...chunks];

//   while (selectedChunks.length < topK && remainingChunks.length > 0) {
//     let bestChunk = null;
//     let bestScore = -Infinity;
//     let bestIndex = -1;

//     for (let i = 0; i < remainingChunks.length; i++) {
//       const currentChunk = remainingChunks[i];
//       const relevance = similarity.cosine(
//         questionEmbedding,
//         currentChunk.embedding,
//       );
//       let redundancy = 0;
//       for (const selectedChunk of selectedChunks) {
//         const chunkSimilarity = similarity.cosine(
//           currentChunk.embedding,
//           selectedChunk.embedding,
//         );
//         redundancy = Math.max(redundancy, chunkSimilarity);
//       }
//       const mmrScore = lambda * relevance - (1 - lambda) * redundancy;

//       if (mmr > bestScore) {
//         bestScore = mmrScore;
//         bestChunk = currentChunk;
//         bestIndex = i;
//       }

//       if (bestChunk === null) break;
//       selectedChunks.push({ ...bestChunk, mmrScore: bestScore });
//       remainingChunks.splice(bestIndex, 1);
//     }
//   }
//   return selectedChunks;
// };
