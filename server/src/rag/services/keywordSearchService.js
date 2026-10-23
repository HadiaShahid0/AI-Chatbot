import bm25 from "wink-bm25-text-search";
// import natural from "natural"
// const stemmer=natural.PorterStemmer;
let keywordSearchEngine = null;
let chunksById = new Map();

const prepareText = (text) => {
  return text.toLowerCase().match(/[\p{L}\p{N}_.-]+/gu || []);
};
// const prepareText = (text) => {
//   return text.toLowerCase().split(/\W+/).filter(Boolean).map((word)=>stemmer.stem(word))
// };
export const buildKeywordIndexService = (chunks) => {
  const engine = bm25();

  engine.defineConfig({
    fldWeights: {
      text: 1,
    },
  });

  engine.definePrepTasks([prepareText]);

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
  if (!keywordSearchEngine)
    throw new Error("BM25 keyword index has not been initialized");

  const results = keywordSearchEngine.search(question, topK);

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

  return keywordResults;
};
