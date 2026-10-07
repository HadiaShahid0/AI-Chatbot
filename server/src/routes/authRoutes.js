import {
  registerUser,
  loginUser,
  logoutUser,
  verifyUser,
} from "../controller/authController.js";

import express from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/verify", authMiddleware, verifyUser);

export default router;
