import { GoogleGenAI } from "@google/genai";

import { generateGeminiResponseStream } from "./geminiServices.js";
import { validateAIInputService } from "./guardrailsServices.js";

import {
  buildDocumentContextService,
} from "./messageServices.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Generate an answer using the existing production Gemini service.
export const generateAnswerForEvaluationService = async ({
  question,
  retrievedChunks,
}) => {
  const conversationContext = [];

  // Reuse the actual document context builder.
  const documentContext = buildDocumentContextService(retrievedChunks);

  if (documentContext) {
    conversationContext.push({
      role: "user",
      parts: [
        {
          text: documentContext,
        },
      ],
    });
  }

  // Add the evaluation question.
  conversationContext.push({
    role: "user",
    parts: [
      {
        text: question,
      },
    ],
  });

  // Generate the answer using the existing Gemini service.
  const aiResponse = await generateGeminiResponseStream(
    conversationContext,
  );

  // Collect streamed text into a complete answer.
  let completeResponse = "";

  for await (const chunk of aiResponse) {
    const chunkText = chunk.text || "";

    const remainingLength = 4000 - completeResponse.length;

    if (remainingLength <= 0) {
      break;
    }

    completeResponse += chunkText.slice(0, remainingLength);

    if (chunkText.length > remainingLength) {
      break;
    }
  }

  // Apply the existing answer validation.
  return validateAIInputService(completeResponse);
};

// Parse the JSON returned by the evaluation model.
const parseJudgeResponse = (text) => {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleanedText);
};

// Evaluate the generated answer using Gemini as an LLM judge.
export const evaluateGenerationService = async ({
  question,
  expectedAnswer,
  actualAnswer,
  retrievedChunks,
  shouldAbstain,
}) => {
  const context = retrievedChunks
    .map((chunk, index) => {
      return `Context ${index + 1}:\n${chunk.text}`;
    })
    .join("\n\n");

  const prompt = `
You are an impartial evaluator for a Retrieval-Augmented Generation (RAG) system.

Evaluate the generated answer using the question, expected answer,
and retrieved document context.

QUESTION:
${question}

EXPECTED ANSWER:
${expectedAnswer}

ACTUAL ANSWER:
${actualAnswer || "[Empty answer]"}

RETRIEVED DOCUMENT CONTEXT:
${context || "[No context retrieved]"}

SHOULD_ABSTAIN:
${shouldAbstain}

Score each metric between 0 and 1.

1. faithfulness:
Measure whether factual claims in the actual answer are supported
by the retrieved document context.
Penalize unsupported claims, invented facts, and contradictions.
A score of 1 means the factual claims are supported by the context.

2. answerRelevancy:
Measure how directly the answer addresses the question.
A score of 1 means the answer directly addresses the question.

3. answerCorrectness:
Compare the actual answer with the expected answer.
Accept equivalent wording and correct paraphrases.
Penalize factual errors and important missing information.
A score of 1 means the answer is accurate and sufficiently complete.

4. abstentionCorrectness:
When SHOULD_ABSTAIN is true:
- Score 1 if the answer correctly states that the requested
  information is unavailable and does not invent an answer.
- Score 0 if the answer invents information or incorrectly claims
  the requested information is available.

When SHOULD_ABSTAIN is false, return null.

Additional rules:
- Evaluate factual support using the retrieved context.
- Do not reward unsupported claims merely because they match
  the expected answer.
- Judge meaning rather than exact wording.
- A correct explanation that information is unavailable should
  receive a high abstentionCorrectness score.
- Return only valid JSON without Markdown fences.

Return this exact structure:
{
  "faithfulness": 0,
  "answerRelevancy": 0,
  "answerCorrectness": 0,
  "abstentionCorrectness": null,
  "reason": "Brief explanation of the scores"
}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const result = parseJudgeResponse(response.text || "");

  const scoreFields = [
    "faithfulness",
    "answerRelevancy",
    "answerCorrectness",
  ];

  // Validate the returned scores.
  for (const field of scoreFields) {
    if (
      typeof result[field] !== "number" ||
      !Number.isFinite(result[field]) ||
      result[field] < 0 ||
      result[field] > 1
    ) {
      throw new Error(`Invalid evaluation score: ${field}`);
    }
  }

  // Validate abstention correctness separately.
  if (shouldAbstain) {
    if (
      typeof result.abstentionCorrectness !== "number" ||
      !Number.isFinite(result.abstentionCorrectness) ||
      result.abstentionCorrectness < 0 ||
      result.abstentionCorrectness > 1
    ) {
      throw new Error("Invalid abstention correctness score.");
    }
  } else {
    result.abstentionCorrectness = null;
  }

  if (typeof result.reason !== "string") {
    result.reason = "";
  }

  return result;
};