import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { generateGeminiResponse } from "../services/geminiServices.js";
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

export const createMessageService = async (
  conversationId,
  userId,
  content,
  file,
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
    content: content,
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
          text: `
Here is a summary of the earlier conversation.
Use it as background context.
${summary}
`,
        },
      ],
    });
  }

  conversationContext.push(...recentContext);

  if (file && uploadedFile) {
    const currentMessage = conversationContext[conversationContext.length - 1];

    if (currentMessage) {
      currentMessage.parts.push({
        fileData: {
          fileUri: uploadedFile.uri,

          mimeType: uploadedFile.mimeType,
        },
      });
    }
  }
  const aiResponse = await generateGeminiResponse(conversationContext);

  const guardrailValidatedResponse = validateAIInputService(aiResponse);

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
