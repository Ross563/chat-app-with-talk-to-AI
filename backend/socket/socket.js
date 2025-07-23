import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import Message from "../models/message.model.js";
dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.frontend_base_url || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Access-Control-Allow-Origin"],
  },
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId != "undefined") userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle typing indicator
  socket.on("typing", ({ receiverId, isTyping }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: userId,
        isTyping,
      });
    }
  });

  // Handle message status updates
  socket.on("messageDelivered", async ({ messageId, receiverId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        message.status = "delivered";
        await message.save();

        const senderSocketId = getReceiverSocketId(message.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdate", {
            messageId,
            status: "delivered",
          });
        }
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  });

  socket.on("messageSeen", async ({ messageId, receiverId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        message.status = "seen";
        await message.save();

        const senderSocketId = getReceiverSocketId(message.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdate", {
            messageId,
            status: "seen",
          });
        }
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
