import express from "express";
import {
  createMessage,
  getMessagesByConversationId,
  getMessageById,
} from "../controller/messageController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createMulter } from "../middlewares/multer.js";
const upload=createMulter("chat")

const router = express.Router();

router.post("/", authMiddleware, upload.single("file"), createMessage);

router.get(
  "/conversations/:conversationId",
  authMiddleware,
  getMessagesByConversationId,
);

router.get("/:messageId", authMiddleware, getMessageById);

export default router;
