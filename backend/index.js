import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 🔥 Required for secure cookies on Render
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Static
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// DB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
