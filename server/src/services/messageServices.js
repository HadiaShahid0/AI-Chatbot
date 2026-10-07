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
export const createMessageService = async (conversationId, userId, content) => {
  validateUserInputService(content);
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const message = await Message.create({
    conversationId,
    role: "user",
    content,
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

  const aiResponse = await generateGeminiResponse(conversationContext);
  const guardrailValidatedResponse = validateAIInputService(aiResponse);

  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: guardrailValidatedResponse,
  });

const messageCount = await Message.count({
  where: {
    conversationId,
  },
});

const lastSummarizedMessageId =
  conversation.lastSummarizedMessageId || 0;

const unsummarizedCount =
  messageCount - lastSummarizedMessageId;

if (unsummarizedCount >= 20) {
  updateConversationSummaryService(conversationId)
    .catch((error) => {
      console.error(
        "Summary update failed:",
        error
      );
    });
}
  return {
    userMessage: message,
    assistantMessage,
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
