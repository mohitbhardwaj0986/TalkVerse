import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { generateResponse, generateVector } from "../utils/ai.service.js";
import { createMemory, quaryMemory } from "../utils/vector.service.js";

const setupSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      withCredentials: true,
      
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

      if (!cookies.token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(cookies.token, process.env.JWT_TOKEN_SECRET);
      const user = await User.findById(decoded._id);

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {

    socket.on("ai-message", async (messagePayload) => {
      try {
        // 1. Save user message
        
        
        const message = await Message.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        });
        
        // 2. Generate vector & query memory
        const vectors = await generateVector(messagePayload.content);
        const memory = await quaryMemory({
          quaryVector: vectors,
          limit: 3,
          metadata: { user: socket.user._id },
        });
        
        
        // 3. Save user message to memory
        await createMemory({
          vectors,
          messageId: message._id,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: message.content,
          },
        });
        
        // 4. Load recent chat history
        const chatHistory = (
          await Message.find({ chat: messagePayload.chat })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
        ).reverse();
        
        const stm = chatHistory.map((item) => ({
          role: item.role,
          parts: [{ text: item.content }],
        }));
        
        const ltm = [
          {
            role: "user",
            parts: [
              {
                text: `These are some previous messages from the chat. Use them to generate a response:\n\n${memory
                .map((item) => item.metadata.text)
                .join("\n")}`,
              },
            ],
          },
        ];
        
        // 5. Generate AI response
        const response = await generateResponse([...ltm, ...stm]);
        
        // 6. Save AI response
        const responseMessage = await Message.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        });
        
        const responseVectors = await generateVector(response);
        await createMemory({
          vectors: responseVectors,
          messageId: responseMessage._id,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: response,
          },
        });
        

        // 7. Send response to client
        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });
      } catch (error) {
        console.error("❌ Error handling ai-message:", error.message);
        socket.emit("ai-error", { error: "Failed to process your request." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`⚡ User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

export { setupSocketServer };
