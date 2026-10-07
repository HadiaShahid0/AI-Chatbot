export const createMessageService = async (
  conversationId,
  userId,
  content
) => {
  // 1. Validate user input
  validateUserInput(content);

  // 2. Check conversation ownership
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // 3. Save user's message
  const userMessage = await Message.create({
    conversationId,
    role: "user",
    content,
  });

  // 4. Get latest 20 messages
  const previousMessages = await Message.findAll({
    where: {
      conversationId,
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });

  // 5. Reverse messages to oldest → newest
  previousMessages.reverse();

  // 6. Convert messages to Gemini format
  const conversationContext = previousMessages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [
      {
        text: message.content,
      },
    ],
  }));

  // 7. Send context to Gemini
  const aiResponse = await generateGeminiResponse(
    conversationContext
  );

  // 8. Save AI response
  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: aiResponse,
  });

  // 9. Return both messages
  return {
    userMessage,
    assistantMessage,
  };
};