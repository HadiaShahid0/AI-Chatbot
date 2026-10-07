import express from "express";
import {
  createMessage,
  getMessagesByConversationId,
  getMessageById,
} from "../controller/messageController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/", authMiddleware, createMessage);
router.get(
  "/conversations/:conversationId",
  authMiddleware,
  getMessagesByConversationId,
);

router.get("/:messageId", authMiddleware, getMessageById);

export default router;