import express from "express";

import authRoutes from "./authRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import messageRoutes from "./messageRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/conversations", conversationRoutes);

router.use("/messages", messageRoutes);

export default router;
