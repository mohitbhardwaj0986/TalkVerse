import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Chat from "../models/chat.model.js";

// Create new chat
const createChat = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const user = req.user;

  // Validation
  if (!title || title.trim().length === 0) {
    throw new ApiError(400, "Chat title is required");
  }


  if (!user || !user._id) {
    throw new ApiError(401, "Unauthorized: user not found");
  }

  // Create chat
  const chat = await Chat.create({
    user: user._id,
    title: title.trim(),
  });

  if (!chat) {
    throw new ApiError(500, "Failed to create chat, try again later");
  }

  // Success response
  return res
    .status(201)
    .json(
      new ApiResponse(201, {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: chat.user,
      }, "Chat created successfully")
    );
});

export { createChat };
