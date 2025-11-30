import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

// Allowed origins (same as server.js)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

// Create socket.io server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Store online users
const userSocketMap = {}; // {userId: socketId}

// Store typing users
const typingUsers = {}; // { userId: receiverId }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let userId = socket.handshake.query.userId;
  if (typeof userId === "string") {
    const u = userId.trim();
    if (u === "" || u === "undefined" || u === "null") userId = undefined;
  }

  if (userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join Group
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Leave Group
  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`User ${userId} left group ${groupId}`);
  });

  // Start typing
  socket.on("startTyping", ({ receiverId }) => {
    if (!userId || !receiverId) return;

    (async () => {
      typingUsers[userId] = receiverId;

      try {
        const receiver = await User.findById(receiverId).select("blockedUsers");
        const typer = await User.findById(userId).select("blockedUsers");
        if (!receiver || !typer) return;

        if (receiver.blockedUsers?.map(String).includes(userId)) return;
        if (typer.blockedUsers?.map(String).includes(receiverId)) return;

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit("userTyping", { userId });
        }
      } catch {}
    })();
  });

  // Stop typing
  socket.on("stopTyping", ({ receiverId }) => {
    if (!userId || typingUsers[userId] !== receiverId) return;

    (async () => {
      delete typingUsers[userId];

      try {
        const receiver = await User.findById(receiverId).select("blockedUsers");
        const typer = await User.findById(userId).select("blockedUsers");
        if (!receiver || !typer) return;

        if (receiver.blockedUsers?.map(String).includes(userId)) return;
        if (typer.blockedUsers?.map(String).includes(receiverId)) return;

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit("userStopTyping", { userId });
        }
      } catch {}
    })();
  });

  // Message delivered
  socket.on("messageDelivered", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg || msg.delivered) return;

      msg.delivered = true;
      msg.deliveredAt = new Date();
      await msg.save();

      const senderSocket = getReceiverSocketId(msg.senderId.toString());
      if (senderSocket) {
        io.to(senderSocket).emit("messageDelivered", {
          _id: messageId,
          delivered: true,
          deliveredAt: msg.deliveredAt,
        });
      }
    } catch {}
  });

  // Message read
  socket.on("messageRead", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg || msg.read) return;

      msg.read = true;
      msg.readAt = new Date();
      await msg.save();

      const senderSocket = getReceiverSocketId(msg.senderId.toString());
      if (senderSocket) {
        io.to(senderSocket).emit("messageRead", {
          _id: messageId,
          read: true,
          readAt: msg.readAt,
        });
      }
    } catch {}
  });

  // FINAL CLEAN disconnect handler (only ONE)
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Update last seen
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch {}
    }

    // Stop typing cleanup
    if (typingUsers[userId]) {
      const receiverId = typingUsers[userId];
      delete typingUsers[userId];

      const receiverSocket = getReceiverSocketId(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("userStopTyping", { userId });
      }
    }
  });
});

export { io, app, server };
