import { Conversation, Message } from "../models/index.js";

import { generateGeminiResponse } from "./geminiService.js";

import { validateUserInputService } from "./guardrailService.js";

import {
  getConversationContextService,
} from "./contextService.js";

import {
  updateConversationSummaryService,
} from "./conversationSummaryService.js";

export const createMessageService = async (
  conversationId,
  userId,
  content
) => {
  validateUserInputService(content);

  // 1. Check conversation belongs to user
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // 2. Save user message
  const userMessage = await Message.create({
    conversationId,
    role: "user",
    content,
  });

  // 3. Get conversation context
  const {
    summary,
    recentContext,
  } = await getConversationContextService(
    conversationId
  );

  // 4. Add summary before recent messages
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

  // 5. Add recent messages
  conversationContext.push(...recentContext);

  // 6. Generate AI response
  const aiResponse = await generateGeminiResponse(
    conversationContext
  );

  // 7. Validate AI response
  const guardrailValidatedResponse =
    validateUserInputService(aiResponse);

  // 8. Save AI response
  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: guardrailValidatedResponse,
  });

  // 9. Update summary when conversation becomes large
  const messageCount = await Message.count({
    where: {
      conversationId,
    },
  });

  if (messageCount % 20 === 0) {
    await updateConversationSummaryService(
      conversationId
    );
  }

  return {
    userMessage,
    assistantMessage,
  };
};