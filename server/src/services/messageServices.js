import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { generateGeminiResponse } from "../services/geminiServices.js";
import {
  validateUserInputService,
  validateAIInputService,
} from "./guardrailsServices.js";
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

  //context
  const previousMessages = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });

  previousMessages.reverse();
  const conversationContext = previousMessages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [
      {
        text: message.content,
      },
    ],
  }));

  const aiResponse = await generateGeminiResponse(conversationContext);
  const guardrailValidatedResponse = validateAIInputService(aiResponse);

  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: guardrailValidatedResponse,
  });
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
