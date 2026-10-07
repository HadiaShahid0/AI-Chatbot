import {
  createMessageService,
  getMessagesByConversationIdService,
  getMessageByIdService,
} from "../services/messageServices.js";

export const createMessage = async (req, res) => {
  const { conversationId, content } = req.body;
  const userId = req.user.id;
  try {
    const message = await createMessageService(conversationId, userId, content);
    res.status(201).json({
      message: "Message created successfully",
      userMessage: message.userMessage,
      assistantMessage: message.assistantMessage,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating message", error: err.message });
  }
};

export const getMessagesByConversationId = async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.id;
  try {
    const messages = await getMessagesByConversationIdService(
      conversationId,
      userId,
    );
    res
      .status(200)
      .json({ message: "Messages fetched successfully", messages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching messages", error: err.message });
  }
};
export const getMessageById = async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;
  try {
    const message = await getMessageByIdService(messageId, userId);
    res.status(200).json({ message: "Message fetched successfully", message });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching message", error: err.message });
  }
};
