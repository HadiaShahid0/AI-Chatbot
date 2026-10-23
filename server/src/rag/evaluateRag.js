import "dotenv/config";

import {
  getRelevantDocumentChunksService,
} from "../services/messageServices.js";

import {
  evaluateRetrievalService,
} from "./services/ragEvaluationService.js";

import {
  initializeHybridSearchService,
} from "./services/initializeService.js";

import {
  generateAnswerForEvaluationService,
  evaluateGenerationService,
} from "../services/generationEvaluationService.js";

import { evaluationDataset } from "./evaluationDataset.js";

const TOP_K = 3;

// Calculate the average of a list of numbers.
const calculateAverage = (values) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

// Format metric values for readable console output.
const formatMetric = (value) => {
  return typeof value !== "number" || !Number.isFinite(value)
    ? "N/A"
    : value.toFixed(2);
};

const evaluateRag = async () => {
  console.log("\n========== RAG EVALUATION ==========");
  console.log(`Total test cases: ${evaluationDataset.length}`);
  console.log(`Top-K: ${TOP_K}`);

  if (evaluationDataset.length === 0) {
    console.log("Evaluation dataset is empty.");
    return;
  }

  // Initialize the search pipeline.
  await initializeHybridSearchService();

  const results = [];

  for (const testCase of evaluationDataset) {
    console.log("\n==============================================");
    console.log(`Question ${testCase.id}: ${testCase.question}`);
    console.log("==============================================");

    try {
      // Step 1: Retrieve chunks using the production pipeline.
      const retrievedChunks = await getRelevantDocumentChunksService(
        testCase.question,
        TOP_K,
      );

      // Step 2: Evaluate retrieval performance.
      const retrievalMetrics = evaluateRetrievalService(
        retrievedChunks,
        testCase.relevantChunkIds,
      );

      console.log("\n========== RETRIEVED CHUNKS ==========");

      console.log(
        retrievedChunks.map((chunk) => chunk.id),
      );

      console.log("\n========== RETRIEVAL METRICS ==========");

      console.log(
        `Precision@${TOP_K}:`,
        formatMetric(retrievalMetrics.precision),
      );

      console.log(
        `Recall@${TOP_K}:`,
        formatMetric(retrievalMetrics.recall),
      );

      console.log(
        "Reciprocal Rank:",
        formatMetric(retrievalMetrics.reciprocalRank),
      );

      // Step 3: Generate an answer using the existing Gemini service.
      const actualAnswer = await generateAnswerForEvaluationService({
        question: testCase.question,
        retrievedChunks,
      });

      console.log("\n========== GENERATED ANSWER ==========");

      console.log("Expected answer:");
      console.log(testCase.expectedAnswer);

      console.log("\nActual answer:");
      console.log(actualAnswer || "[Empty answer]");

      // Step 4: Evaluate the generated answer.
      const generationMetrics = await evaluateGenerationService({
        question: testCase.question,
        expectedAnswer: testCase.expectedAnswer,
        actualAnswer,
        retrievedChunks,
        shouldAbstain: Boolean(testCase.shouldAbstain),
      });

      console.log("\n========== GENERATION METRICS ==========");

      console.log(
        "Faithfulness:",
        formatMetric(generationMetrics.faithfulness),
      );

      console.log(
        "Answer Relevancy:",
        formatMetric(generationMetrics.answerRelevancy),
      );

      console.log(
        "Answer Correctness:",
        formatMetric(generationMetrics.answerCorrectness),
      );

      if (testCase.shouldAbstain) {
        console.log(
          "Abstention Correctness:",
          formatMetric(generationMetrics.abstentionCorrectness),
        );
      }

      console.log("Evaluation reason:", generationMetrics.reason);

      // Step 5: Save the complete result.
      results.push({
        questionId: testCase.id,
        question: testCase.question,

        answerable: !testCase.shouldAbstain,

        // Retrieval metrics
        retrievedCount: retrievalMetrics.retrievedCount,
        relevantCount: retrievalMetrics.relevantCount,
        relevantRetrievedCount: retrievalMetrics.relevantRetrievedCount,
        precision: retrievalMetrics.precision,
        recall: retrievalMetrics.recall,
        reciprocalRank: retrievalMetrics.reciprocalRank,

        // Generation metrics
        faithfulness: generationMetrics.faithfulness,
        answerRelevancy: generationMetrics.answerRelevancy,
        answerCorrectness: generationMetrics.answerCorrectness,
        abstentionCorrectness: generationMetrics.abstentionCorrectness,

        reason: generationMetrics.reason,
        error: null,
      });
    } catch (error) {
      console.error(
        `Failed to evaluate question ${testCase.id}:`,
        error.message,
      );

      // Keep failed test cases visible in the results.
      results.push({
        questionId: testCase.id,
        question: testCase.question,
        answerable: !testCase.shouldAbstain,

        precision: null,
        recall: null,
        reciprocalRank: null,

        faithfulness: null,
        answerRelevancy: null,
        answerCorrectness: null,
        abstentionCorrectness: null,

        reason: "",
        error: error.message,
      });
    }
  }

  // Include only test cases that completed both evaluations.
  const successfulResults = results.filter(
    (result) => result.error === null,
  );

  console.log("\n========== INDIVIDUAL RESULTS ==========");
  console.table(results);

  if (successfulResults.length === 0) {
    console.log("No test cases completed successfully.");
    return;
  }

  // Calculate average retrieval metrics.
  const averagePrecision = calculateAverage(
    successfulResults.map((result) => result.precision),
  );

  const averageRecall = calculateAverage(
    successfulResults
      .map((result) => result.recall)
      .filter((value) => value !== null),
  );

  const averageMRR = calculateAverage(
    successfulResults.map((result) => result.reciprocalRank),
  );

  // Calculate average generation metrics.
  const averageFaithfulness = calculateAverage(
    successfulResults.map((result) => result.faithfulness),
  );

  const averageAnswerRelevancy = calculateAverage(
    successfulResults.map((result) => result.answerRelevancy),
  );

  const averageAnswerCorrectness = calculateAverage(
    successfulResults.map((result) => result.answerCorrectness),
  );

  // Abstention correctness applies only to questions marked for abstention.
  const abstentionResults = successfulResults
    .filter((result) => result.abstentionCorrectness !== null)
    .map((result) => result.abstentionCorrectness);

  const averageAbstentionCorrectness = calculateAverage(
    abstentionResults,
  );

  // Separate answerable and unanswerable questions.
  const answerableResults = successfulResults.filter(
    (result) => result.answerable,
  );

  const unanswerableResults = successfulResults.filter(
    (result) => !result.answerable,
  );

  console.log("\n========== AVERAGE RETRIEVAL METRICS ==========");

  console.log("Successful evaluations:", successfulResults.length);
  console.log("Failed evaluations:", results.length - successfulResults.length);

  console.log(
    `Average Precision@${TOP_K}:`,
    formatMetric(averagePrecision),
  );

  console.log(
    `Average Recall@${TOP_K}:`,
    formatMetric(averageRecall),
  );

  console.log(
    "Mean Reciprocal Rank (MRR):",
    formatMetric(averageMRR),
  );

  console.log("\n========== AVERAGE GENERATION METRICS ==========");

  console.log(
    "Average Faithfulness:",
    formatMetric(averageFaithfulness),
  );

  console.log(
    "Average Answer Relevancy:",
    formatMetric(averageAnswerRelevancy),
  );

  console.log(
    "Average Answer Correctness:",
    formatMetric(averageAnswerCorrectness),
  );

  console.log(
    "Average Abstention Correctness:",
    formatMetric(averageAbstentionCorrectness),
  );

  console.log("\n========== DATASET BREAKDOWN ==========");

  console.log("Answerable questions:", answerableResults.length);
  console.log("Unanswerable questions:", unanswerableResults.length);

  console.log("\n========== ANSWERABLE QUESTION METRICS ==========");

  console.log(
    "Faithfulness:",
    formatMetric(
      calculateAverage(
        answerableResults.map((result) => result.faithfulness),
      ),
    ),
  );

  console.log(
    "Answer Relevancy:",
    formatMetric(
      calculateAverage(
        answerableResults.map((result) => result.answerRelevancy),
      ),
    ),
  );

  console.log(
    "Answer Correctness:",
    formatMetric(
      calculateAverage(
        answerableResults.map((result) => result.answerCorrectness),
      ),
    ),
  );

  console.log("\n========== EVALUATION COMPLETED ==========");
};

evaluateRag().catch((error) => {
  console.error("RAG evaluation initialization failed:", error);
  process.exitCode = 1;
});