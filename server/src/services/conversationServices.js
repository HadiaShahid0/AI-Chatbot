import Conversation from "../models/conversationModel.js";

export const createConversationService = async (userId, title) => {
  const conversation = await Conversation.create({
    userId,
    title: title || "New Chat",
  });
  
  return conversation;
}

export const getUserConversationsService = async (userId) => {
  const conversations = await Conversation.findAll({
    where: {
      userId,
    },
    order: [["updatedAt", "DESC"]],
  });

  return conversations;
}

export const getConversationService = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}