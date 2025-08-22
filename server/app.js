import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import cors from "cors";
import erroHandler from "./middleware/errorHandler.js";
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    Credentials: true,
  })
);

app.use(express.static("public"));
import userRouter from "./routes/user.route.js";
import chatRouter from "./routes/chat.route.js";
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);

app.use(erroHandler);

export default app;
