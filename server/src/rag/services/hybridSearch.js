import { searchKeywordChunksService } from "./keywordSearchService.js";
import { retrieveRelevantChunksService } from "./retrievalService.js";

const K = 60;

export const hybridSearchService = async ({ question, topK = 5 }) => {
  if (!question.trim()) throw new Error("Question cannot be empty");

  const [keywordResults, vectorResults] = await Promise.all([
    searchKeywordChunksService(question, topK * 2),
    retrieveRelevantChunksService({ question, topK: topK * 2 }),
  ]);

  const fusedItems = new Map();

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
          metadata: item.metadata ||{},
          rrfScore: 0,
          vectorRank: null,
          keywordRank: null,
        });
      }
      const fusedItem = fusedItems.get(itemId);

      fusedItem.metadata={
        ...fusedItem.metadata,
        ...(item.metadata||{})
      }

      if(!fusedItem.text && item.text) fusedItem.text=item.text;
      if (searchType === "vector") {
        fusedItem.vectorRank = rank;
      } else {
        fusedItem.keywordRank = rank;
      }

      fusedItem.rrfScore += 1 / (K + rank);
    });
  };

  addSearchResults(keywordResults, "keyword");
  addSearchResults(vectorResults, "vector");

  const hybridResults = Array.from(fusedItems.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);

  console.log("HYBRID SEARCH RESULT");
  console.log("Question:", question);
  console.log("Keyword results:", keywordResults.length);
  console.log("Vector results:", vectorResults.length);
  console.log("Final hybrid results:", hybridResults.length);

  console.table(
    hybridResults.map((item) => ({
      id: item.id,
      vectorRank: item.vectorRank,
      keywordRank: item.keywordRank,
      rrfScore: item.rrfScore,
      fileName: item.metadata?.fileName,
    })),
  );

  return hybridResults;
};
