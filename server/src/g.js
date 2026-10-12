export const createMessageService = async (
  conversationId,
  userId,
  content,
  file,
  res,
) => {
  // Validate user input
  if (!content?.trim() && !file) {
    validateUserInputService(content);
  }

  // Check whether the conversation belongs to the user
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Upload the file to Gemini if a file exists
  let uploadedFile = null;

  if (file) {
    uploadedFile = await uploadFileToGemini(file);
  }

  // Save the user's message
  const userMessage = await Message.create({
    conversationId,
    role: "user",
    content,
    fileName: file?.originalname || null,
    fileType: file?.mimetype || null,
    fileSize: file?.size || null,
    filePath: file?.path || null,
    geminiFileUri: uploadedFile?.uri || null,
  });

  // Get the conversation summary and recent messages
  const { summary, recentContext } =
    await getConversationContextService(conversationId);

  const conversationContext = [];

  // Add the conversation summary
  if (summary) {
    conversationContext.push({
      role: "user",
      parts: [
        {
          text: `Summary of the earlier conversation:\n${summary}`,
        },
      ],
    });
  }

  // Add recent messages
  conversationContext.push(...recentContext);

  // Add the uploaded file to the current message
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

  // Start the Gemini stream
  const response = await generateGeminiResponseStream(conversationContext);

  // Store the complete AI response
  let completeResponse = "";

  // Send each chunk to the frontend
  for await (const chunk of response) {
    const text = chunk.text || "";

    completeResponse += text;

    res.write(text);
  }

  // Validate the complete AI response
  const validatedResponse = validateAIInputService(completeResponse);

  // Save the assistant's response to MySQL
  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: validatedResponse,
  });

  // Check how many messages need summarization
  const lastSummarizedMessageId = conversation.lastSummarizedMessageId || 0;

  const unsummarizedCount = await Message.count({
    where: {
      conversationId,
      id: {
        [Op.gt]: lastSummarizedMessageId,
      },
    },
  });

  // Update the summary when enough messages have accumulated
  if (unsummarizedCount >= 5) {
    updateConversationSummaryService(conversationId).catch((error) => {
      console.error("Summary update failed:", error);
    });
  }

  // Return the saved messages and attachment information
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
