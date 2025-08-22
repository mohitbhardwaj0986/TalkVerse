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
    // Save msg + generate vectors + fetch history in parallel
    const [message, vectors, chatHistory] = await Promise.all([
      Message.create({
        chat: messagePayload.chat,
        user: socket.user._id,
        content: messagePayload.content,
        role: "user",
      }),
      generateVector(messagePayload.content),
      Message.find({ chat: messagePayload.chat })
        .sort({ createdAt: -1 })
        .limit(10) // limit tighter
        .lean(),
    ]);

    // Query memory in parallel (non-blocking)
    const memoryPromise = quaryMemory({
      quaryVector: vectors,
      limit: 3,
      metadata: { user: socket.user._id },
    });

    // Prepare chat history
    const stm = chatHistory.reverse().map((item) => ({
      role: item.role,
      parts: [{ text: item.content }],
    }));

    // Get memory results
    const memory = await memoryPromise;

    const ltm = memory.length
      ? [{
          role: "user",
          parts: [{
            text: `Relevant past context:\n\n${memory.map((m) => m.metadata.text).join("\n")}`,
          }],
        }]
      : [];

    // AI response (main bottleneck)
    const response = await generateResponse([...ltm, ...stm]);

    // Save + send response
    const responseMessage = await Message.create({
      chat: messagePayload.chat,
      user: socket.user._id,
      content: response,
      role: "model",
    });

    socket.emit("ai-response", { content: response, chat: messagePayload.chat });

    // Fire-and-forget background vector saves
    Promise.all([
      createMemory({ vectors, messageId: message._id, metadata: { chat: messagePayload.chat, user: socket.user._id, text: message.content } }),
      generateVector(response).then((respVectors) =>
        createMemory({ vectors: respVectors, messageId: responseMessage._id, metadata: { chat: messagePayload.chat, user: socket.user._id, text: response } })
      ),
    ]).catch(console.error);

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
