import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import groupMessageRoutes from "./routes/groupMessage.route.js";
import voiceRoutes from "./routes/voice.route.js";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

connectDB();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

// CORS setup for production
const allowedOrigins = [
  process.env.FRONTEND_URL,       // render domain of frontend
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true); // Postman etc
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS"));
  },
  credentials: true,  // very important for cookie
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Cookie"]
}));

// Temp folder for uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/group-messages", groupMessageRoutes);
app.use("/api/voice-messages", voiceRoutes);

app.get("/", (req, res) => res.send({ ok: true }));

// 404 handler
app.use((req,res) => res.status(404).send({ message: "Route Not Found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send({ message: "Internal Server Error" });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
