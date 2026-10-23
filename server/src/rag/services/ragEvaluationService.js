export const calculatePrecisionAtK = (retrievedChunkIds, relevantChunkIds) => {
  if (retrievedChunkIds.length === 0) return 0;

  const relevantIds = new Set(relevantChunkIds);
  const relevantRetrievedChunks = retrievedChunkIds.filter((chunkId) =>
    relevantIds.has(chunkId),
  );
  return relevantRetrievedChunks.length / retrievedChunkIds.length;
};

export const calculateRecallAtK = (retrievedChunkIds, relevantChunkIds) => {
  const relevantIds = new Set(relevantChunkIds);
  if (relevantIds.size === 0) return null;

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
  if (firstRelevantIndex === -1) return 0;
  const rank = firstRelevantIndex + 1;

  return 1 / rank;
};

export const evaluateRetrievalService = (retrievedChunks, relevantChunkIds) => {
  const retrievedChunkIds = retrievedChunks.map((chunk) => chunk.id);
  const relevantIds = new Set(relevantChunkIds);

  const relevantRetrievedCount = retrievedChunkIds.filter((chunkId) =>
    relevantIds.has(chunkId),
  ).length;
  return {
    retrievedCount: retrievedChunkIds.length,
    relevantCount: relevantIds.size,
    relevantRetrievedCount,
    precision: calculatePrecisionAtK(retrievedChunkIds, relevantChunkIds),
    recall: calculateRecallAtK(retrievedChunkIds, relevantChunkIds),
    reciprocalRank: calculateReciprocalRank(
      retrievedChunkIds,
      relevantChunkIds,
    ),
  };
};
