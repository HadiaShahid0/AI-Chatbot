import { rerankChunksService } from "../rag/services/re-rankerService.js";
import { hybridSearchService } from "../rag/services/hybridSearch.js";

export const searchWikipedia = async ({ topic }) => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json`;

  const response = await fetch(url);

  const data = await response.json();

  return data.query.search.map((item) => ({
    title: item.title,
    snippet: item.snippet.replace(/<[^>]*>/g, ""),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replaceAll(" ", "_"))}`,
  }));
};

export const getRelevantDocumentChunksService = async (question, topK = 5) => {
  if (!question?.trim()) return [];

  try {
    const candidateChunks = await hybridSearchService({
      question,
      topK: topK * 2,
    });

    console.log(`Retrieved ${candidateChunks.length} candidate chunks.`);

    console.log(
      JSON.stringify(
        candidateChunks.map((chunk, index) => ({
          rank: index + 1,
          id: chunk.id,
          text: chunk.text,
          metadata: chunk.metadata,
          distance: chunk.distance,
          vectorRank: chunk.vectorRank,
          keywordRank: chunk.keywordRank,
          rrfScore: chunk.rrfScore,
        })),
        null,
        2,
      ),
    );
    if (candidateChunks.length === 0) return [];

    const rerankedChunks = await rerankChunksService({
      question,
      chunks: candidateChunks,
      topK,
    });

    const threshold = -9;

    const relevantChunks = rerankedChunks.filter((chunk) => {
      return chunk.rerankScore >= threshold;
    });

    const rejectedChunks = rerankedChunks.filter((chunk) => {
      return chunk.rerankScore < threshold;
    });
    console.log(`Re-ranking selected ${rerankedChunks.length} chunks.`);
    console.log("\n========== ACCEPTED CHUNKS ==========");
    console.log(`Accepted: ${relevantChunks.length}`);

    console.log(
      JSON.stringify(
        relevantChunks.map((chunk, index) => ({
          rank: index + 1,
          id: chunk.id,
          text: chunk.text,
          metadata: chunk.metadata,
          distance: chunk.distance,
          vectorRank: chunk.vectorRank,
          keywordRank: chunk.keywordRank,
          rrfScore: chunk.rrfScore,
          rerankScore: chunk.rerankScore,
          status: "ACCEPTED",
        })),
        null,
        2,
      ),
    );

    // Step 7: Display rejected chunks
    console.log("\n========== REJECTED CHUNKS ==========");
    console.log(`Rejected: ${rejectedChunks.length}`);

    console.log(
      JSON.stringify(
        rejectedChunks.map((chunk, index) => ({
          rank: index + 1,
          id: chunk.id,
          text: chunk.text,
          metadata: chunk.metadata,
          distance: chunk.distance,
          rrfScore: chunk.rrfScore,
          rerankScore: chunk.rerankScore,
          status: "REJECTED",
        })),
        null,
        2,
      ),
    );

    console.log(`Score threshold: ${threshold}`);
    console.log(`Chunks before thresholding: ${rerankedChunks.length}`);
    console.log(`Chunks after thresholding: ${relevantChunks.length}`);
    console.log(`Chunks rejected: ${rejectedChunks.length}`);

    return relevantChunks;
  } catch (error) {
    console.error("Document retrieval failed:", error);
    return [];
  }
};
