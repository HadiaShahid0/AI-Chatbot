import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { generateGeminiResponseStream } from "../services/geminiServices.js";
import {
  validateUserInputService,
  validateAIInputService,
} from "./guardrailsServices.js";
import {
  getConversationContextService,
  updateConversationSummaryService,
} from "./conversationServices.js";
import { Op } from "sequelize";
import { uploadFileToGemini } from "./geminiServices.js";
import { retrieveRelevantChunksService } from "../rag/services/retrievalService.js";

export const createMessageService = async (
  conversationId,
  userId,
  content,
  file,
  res,
) => {
  if (!content?.trim() && !file) {
    validateUserInputService(content);
  }
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  let uploadedFile = null;

  if (file) {
    uploadedFile = await uploadFileToGemini(file);
  }

  const message = await Message.create({
    conversationId,
    role: "user",
    content,
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
          text: ` Summary of earlier conversation: \n${summary}`,
        },
      ],
    });
  }

  let retrievedChunks = [];
  if (content?.trim()) {
    try {
      retrievedChunks = await retrieveRelevantChunksService({
        question: content,
        topK: 5,
      });
      console.log(
        `Retrieved ${retrievedChunks.length} relevant document chunks`,
      );
        console.log("Retrieved chunks:", retrievedChunks.length);
    console.log("Retrieved document content:", retrievedChunks);
    } catch (err) {
      console.error("Document retrieval failed:", err);
    }
  }

  if (retrievedChunks.length > 0) {
    const documentContext = retrievedChunks
      .map((chunk, index) => {
        return `Document Chunk ${index + 1}:\n${chunk.text}`;
      })
      .join("\n\n");

    conversationContext.push({
      role: "user",
      parts: [
        {
          text: `
Relevant information retrieved from the provided document:

${documentContext} 

Instructions:
- Use the provided document information to answer questions about the document.
- Do not invent facts or claim the document contains information that is not provided.
- If the available information is insufficient to answer the question, clearly say so.
- Use the conversation history when relevant.
- Do not mention chunks, embeddings, vector databases, or the retrieval process unless these topics are explicitly mentioned in the document and are relevant to the user's question.
- Give only the information relevant to the user's question.
        `,
        },
      ],
    });
  }
  conversationContext.push(...recentContext);
  const aiResponse = await generateGeminiResponseStream(conversationContext);

  let completeResponse = "";
  for await (const chunk of aiResponse) {
    const text = chunk.text || "";
    completeResponse += text;
    res.write(text);
  }

  const guardrailValidatedResponse = validateAIInputService(completeResponse);

  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: guardrailValidatedResponse,
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
    userMessage: message,
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
