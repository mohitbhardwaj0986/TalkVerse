import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createChat } from "../controllers/chat.controller.js";
const router = express.Router();

router.route("/").post(authMiddleware,createChat );

export default router;
