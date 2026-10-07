import {
  createConversation,
  getUserConversation,
  getConversation,
} from "../controller/conversationController.js";
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createConversation);
router.get("/", authMiddleware, getUserConversation);
router.get("/:conversationId", authMiddleware, getConversation);

export default router;
