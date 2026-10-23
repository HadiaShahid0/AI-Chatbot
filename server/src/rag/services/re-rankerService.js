import {
  AutoTokenizer,
  AutoModelForSequenceClassification,
} from "@huggingface/transformers";

let tokenizer;
let rerankerModel;

const loadRerankerModel = async () => {
  if (!tokenizer || !rerankerModel) {
    const modelName = "Xenova/ms-marco-MiniLM-L-6-v2";
    tokenizer = await AutoTokenizer.from_pretrained(modelName);
    rerankerModel =
      await AutoModelForSequenceClassification.from_pretrained(modelName);
  }

  return { tokenizer, rerankerModel };
};

export const rerankChunksService = async ({ question, chunks, topK = 7 }) => {
  if (!question || !question.trim())
    throw new Error("Question cannot be empty");
  if (!chunks || chunks.length === 0) return [];

  const { tokenizer, rerankerModel } = await loadRerankerModel();

  const questions = chunks.map(() => question);
  const documents = chunks.map((chunk) => chunk.text);

  const inputs = tokenizer(questions, {
    text_pair: documents,
    padding: true,
    truncation: true,
  });

  const result = await rerankerModel(inputs);
  const scores = Array.from(result.logits.data);

  const chunksWithScores = chunks.map((chunk, index) => {
    return {
      ...chunk,
      rerankScore: scores[index],
    };
  });

  chunksWithScores.sort((chunkA, chunkB) => {
    return chunkB.rerankScore - chunkA.rerankScore;
  });

  return chunksWithScores.slice(0, topK);
};
