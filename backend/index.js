import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';    
import userRouter from './routes/user.routes.js';
import path from 'path';
import { geminiresponse } from './gemini.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Serve uploaded images
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Connect DB
connectDB();

// Test route
app.get('/', (req, res) => {
    res.send('API is running 🚀');
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
