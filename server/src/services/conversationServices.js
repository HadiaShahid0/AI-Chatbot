import { Message, Conversation } from "../models/index.js";
import { generateGeminiResponse } from "./geminiServices.js";

export const createConversationService = async (userId, title) => {
  const conversation = await Conversation.create({
    userId,
    title: title || "New Chat",
  });

  return conversation;
};

export const getUserConversationsService = async (userId) => {
  const conversations = await Conversation.findAll({
    where: {
      userId,
    },
    order: [["updatedAt", "DESC"]],
  });

  return conversations;
};

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
};

export const updateConversationSummaryService = async (
  conversationId
) => {
  console.log(
    "SUMMARY SERVICE STARTED:",
    conversationId
  );

  const conversation = await Conversation.findByPk(
    conversationId
  );

  if (!conversation) {
    console.log("Conversation not found");

    throw new Error("Conversation not found");
  }

  console.log(
    "OLD SUMMARY:",
    conversation.summary
  );

  console.log(
    "OLD LAST ID:",
    conversation.lastSummarizedMessageId
  );

  const whereCondition = {
    conversationId,
  };

  if (conversation.lastSummarizedMessageId) {
    whereCondition.id = {
      [Op.gt]: conversation.lastSummarizedMessageId,
    };
  }

  const messages = await Message.findAll({
    where: whereCondition,
    order: [["createdAt", "ASC"]],
  });

  console.log(
    "MESSAGES TO SUMMARIZE:",
    messages.length
  );

  if (!messages.length) {
    console.log("No messages to summarize");

    return conversation.summary || "";
  }

  const conversationText = messages
    .map((message) => {
      const role =
        message.role === "user"
          ? "User"
          : "Assistant";

      return `${role}: ${message.content}`;
    })
    .join("\n");

  const prompt = `
You are updating a conversation summary.

Previous summary:
${conversation.summary || "No previous summary."}

New messages:
${conversationText}

Create an updated summary.

Keep:
- Important topics
- Important questions
- Important answers
- User preferences
- Decisions
- Important facts
- Ongoing tasks

Do not invent information.

Return only the updated summary.
`;

  console.log("CALLING GEMINI FOR SUMMARY...");

  const summaryResponse =
    await generateGeminiResponse([
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ]);

  console.log(
    "GEMINI SUMMARY:",
    summaryResponse
  );

  const lastMessage =
    messages[messages.length - 1];

  console.log(
    "LAST MESSAGE ID:",
    lastMessage.id
  );

  await conversation.update({
    summary: summaryResponse,
    lastSummarizedMessageId: lastMessage.id,
  });

  console.log("SUMMARY SAVED");

  return summaryResponse;
};

export const getConversationContextService = async (
  conversationId
) => {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const previousMessages = await Message.findAll({
    where: {
      conversationId,
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });

  previousMessages.reverse();

  const recentContext = previousMessages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [
      {
        text: message.content,
      },
    ],
  }));

  return {
    summary: conversation.summary || "",
    recentContext,
  };
};

