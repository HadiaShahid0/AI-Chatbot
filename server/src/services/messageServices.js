import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { generateGeminiResponseStream } from "../services/geminiServices.js";
import {
  validateUserInputService,
  validateAIInputService,
  MAX_AI_RESPONSE_LENGTH,
} from "./guardrailsServices.js";
import {
  getConversationContextService,
  updateConversationSummaryService,
} from "./conversationServices.js";
import { Op } from "sequelize";
import { uploadFileToGemini } from "./geminiServices.js";
import { retrieveRelevantChunksService } from "../rag/services/retrievalService.js";
import { rerankChunksService } from "../rag/services/re-rankerService.js";
import { hybridSearchService } from "../rag/services/hybridSearch.js";

export const streamGeminiResponseService = async (aiResponse, res) => {
  let completeResponse = "";

  for await (const chunk of aiResponse) {
    const chunkText = chunk.text || "";

    const remainingLength = MAX_AI_RESPONSE_LENGTH - completeResponse.length;

    if (remainingLength <= 0) {
      break;
    }

    const textToSend = chunkText.slice(0, remainingLength);

    completeResponse += textToSend;

    if (textToSend) {
      res.write(textToSend);
    }

    if (textToSend.length < chunkText.length) {
      break;
    }
  }

  const validatedResponse = validateAIInputService(completeResponse);

  if (!completeResponse.trim()) {
    res.write(validatedResponse);
  }

  return validatedResponse;
};
// export const getRelevantDocumentChunksService = async (question, topK = 5) => {
//   if (!question?.trim()) return [];

//   try {
//     const candidateChunks = await retrieveRelevantChunksService({
//       question,
//       topK,
//     });

//     console.log(`Retrieved ${candidateChunks.length} candidate chunks.`);

//     console.log(
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
//       return [];
//     }

//     const rerankedChunks = await rerankChunksService({
//       question,
//       chunks: candidateChunks,
//       topK,
//     });
//     const threshold = -8;

//     const relevantChunks = rerankedChunks.filter((chunk) => {
//       return chunk.rerankScore >= threshold;
//     });
//     const rejectedChunks = rerankedChunks.filter((chunk) => {
//       return chunk.rerankScore < threshold;
//     });
//     console.log(`Re-ranking selected ${rerankedChunks.length} chunks.`);
//     console.log("\n========== ACCEPTED CHUNKS ==========");
//     console.log(`Accepted: ${relevantChunks.length}`);

//     console.log(
//       JSON.stringify(
//         relevantChunks.map((chunk, index) => ({
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
//     console.log(
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
//     console.log(`Score threshold: ${threshold}`);
//     console.log(`Chunks before thresholding: ${rerankedChunks.length}`);
//     console.log(`Chunks after thresholding: ${relevantChunks.length}`);
//     console.log(
//       `Chunks rejected: ${rerankedChunks.length - relevantChunks.length}`,
//     );
//     return relevantChunks;
//   } catch (error) {
//     console.error("Document retrieval failed:", error);
//     return [];
//   }
// };

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

export const buildDocumentContextService = (chunks) => {
  if (!chunks.length) {
    return null;
  }

  const documentContext = chunks
    .map((chunk, index) => {
      return `Document Chunk ${index + 1}:\n${chunk.text}`;
    })
    .join("\n\n");

  return `
Relevant information retrieved from the provided document:

${documentContext}

Instructions:
- For questions about provided documents, base factual claims on the available document context.
- Do not invent facts or claim information is present when it is not.
- Do not use general knowledge to fill gaps in document-specific answers.
- If the context does not support an answer, clearly explain what information is missing.
- Combine information from multiple chunks when necessary.
- When listing items, include all matching items supported by the provided context.
- Avoid duplicate items.
- Use conversation history to understand follow-up questions when relevant, but do not treat it as proof of what a document contains.
- For unrelated general questions, answer normally using general knowledge.
- Do not mention chunks, embeddings, vector databases, or retrieval unless explicitly asked.
- Keep the answer focused on the user's question.
`;
};

export const createMessageService = async (
  conversationId,
  userId,
  content,
  file,
  res,
) => {
  validateUserInputService(content ?? "", file);

  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  let uploadedFile = null;

  if (file) {
    uploadedFile = await uploadFileToGemini(file);
  }

  const userMessage = await Message.create({
    conversationId,
    role: "user",
    content: content ?? "",
    fileName: file?.originalname || null,
    fileType: file?.mimetype || null,
    fileSize: file?.size || null,
    filePath: file?.path || null,
    geminiFileUri: uploadedFile?.uri || null,
  });

  const { summary, recentContext } =
    await getConversationContextService(conversationId);

  const conversationContext = [];

  if (summary) {
    conversationContext.push({
      role: "user",
      parts: [
        {
          text: `Summary of earlier conversation:\n${summary}`,
        },
      ],
    });
  }

  const retrievedChunks = await getRelevantDocumentChunksService(
    content ?? "",
    5,
  );

  const documentContext = buildDocumentContextService(retrievedChunks);

  if (documentContext) {
    conversationContext.push({
      role: "user",
      parts: [{ text: documentContext }],
    });
  }

  conversationContext.push(...recentContext);

  const aiResponse = await generateGeminiResponseStream(conversationContext);

  const assistantContent = await streamGeminiResponseService(aiResponse, res);

  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: assistantContent,
  });

  const lastSummarizedMessageId = conversation.lastSummarizedMessageId || 0;

  const unsummarizedCount = await Message.count({
    where: {
      conversationId,
      id: {
        [Op.gt]: lastSummarizedMessageId,
      },
    },
  });

  if (unsummarizedCount >= 5) {
    updateConversationSummaryService(conversationId).catch((error) => {
      console.error("Summary update failed:", error);
    });
  }

  return {
    userMessage,
    assistantMessage,
    attachment: uploadedFile
      ? {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          geminiFileUri: uploadedFile.uri,
        }
      : null,
  };
};

export const getMessagesByConversationIdService = async (
  conversationId,
  userId,
) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  const messages = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
  return messages;
};

export const getMessageByIdService = async (messageId, userId) => {
  const message = await Message.findOne({
    where: { id: messageId },
    include: [
      {
        model: Conversation,
        where: {
          userId,
        },
      },
    ],
  });
  if (!message) {
    throw new Error("Message not found");
  }
  return message;
};
