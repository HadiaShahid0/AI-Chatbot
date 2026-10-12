export const sendMessageServices = async (
  conversationId,
  content,
  file,
  onChunk,
  onUserMessage,
) => {
  const formData = new FormData();

  formData.append("conversationId", conversationId);
  formData.append("content", content || "");

  if (file) {
    formData.append("file", file);
  }

  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.error || errorData.message || "Failed to send message",
    );
  }

  if (!response.body) {
    throw new Error("The response stream is unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let assistantMessage = null;
  let attachment = null;

  const processEvent = (line) => {
    if (!line.trim()) {
      return;
    }

    const event = JSON.parse(line);

    if (event.type === "userMessage") {
      onUserMessage?.(event.data);
    } else if (event.type === "chunk") {
      onChunk?.(event.text);
    } else if (event.type === "done") {
      assistantMessage = event.assistantMessage;
      attachment = event.attachment;
    } else if (event.type === "error") {
      throw new Error(event.message || "Streaming failed");
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      // Keep any incomplete line for the next read.
      buffer = lines.pop() || "";

      for (const line of lines) {
        processEvent(line);
      }
    }

    // Finish decoding any remaining bytes.
    buffer += decoder.decode();

    // Process the final event if it has no trailing newline.
    if (buffer.trim()) {
      processEvent(buffer);
    }

    if (!assistantMessage) {
      throw new Error("The stream ended without a completed assistant message");
    }

    return {
      assistantMessage,
      attachment,
    };
  } finally {
    reader.releaseLock();
  }
};


export const createMessage = async (req, res) => {
  const sendEvent = (e) => {
    if (res.writeableEnded || res.destroyed) {
      return;
    }
    res.write(`${JSON.stringify(e)}\n`);
  };
  try {
    const { conversationId, content } = req.body;

    console.log("conversationId:", conversationId);
    console.log("content:", content);
    console.log("file:", req.file);

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders?.();

    const result = await createMessageService(
      conversationId,
      req.user.id,
      content,
      req.file,
      sendEvent,
    );

    sendEvent({
      type: "done",
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      attachment: result.attachment,
    });

    res.end();
  } catch (error) {
    console.error("Error creating message:", error);
    if (res.headersSent) {
      sendEvent({
        type: "error",
        message: error.message || "Error creating message",
      });

      if (!res.writeableEnded && !res.destroyed) {
        res.end();
      }
    } else {
      res.status(500).json({
        message: "Error creating message",
        error: error.message,
      });
    }
  }
};

export const createMessageService = async (
  conversationId,
  userId,
  content,
  file,
  onEvent
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
  
  onEvent?.({
    type: "userMessage",
    data:message
  })
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
  const aiResponse = await generateGeminiResponse(conversationContext, (text)=>{
    onEvent?.({
      type:"chunk",
      text
    })
  });

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

export const generateGeminiResponse = async (contents, onChunk) => {
  let completeResponse = "";
  console.log("Sending request to Gemini...");

  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash-lite",
    contents,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;

    if (text) {
      completeResponse += text;
      onChunk?.(text);
    }
  }

  console.log("Gemini response received.");

  return completeResponse;
};