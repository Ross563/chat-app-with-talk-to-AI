import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { generateResult } from "../utils/aiModel.js";
import cloudinary from "../utils/cloudinary.js";

export const sendMessage = async (req, res) => {
  try {
    // const { text, KeyIV } = req.body;
    // 👇 Make sure to parse if stringified
    // const KeyIV =
    //   typeof req.body.KeyIV === "string"
    //     ? JSON.parse(req.body.KeyIV)
    //     : req.body.KeyIV;

    // const text =
    //   typeof req.body.text === "string"
    //     ? JSON.parse(req.body.text)
    //     : req.body.text;
    const KeyIV =
      typeof req.body.KeyIV === "string"
        ? req.body.KeyIV
        : JSON.stringify(req.body.KeyIV);

    const text =
      typeof req.body.text === "string"
        ? req.body.text
        : JSON.stringify(req.body.text);

    console.log("KeyIV from sendMessage controller: ", KeyIV);
    // const trimmedText = text.trimStart();
    const trimmedText = text;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let imageUrl;
    if (req.file) {
      console.log("File received:", req.file);
      const { buffer: imageBuffer } = req.file;

      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype.split("/")[1];
      const uploadResponse = await cloudinary.uploader.upload(
        `data:image/${mimeType};base64,${base64Image}`,
        {
          folder: "chat-app",
        }
      );

      imageUrl = uploadResponse.secure_url;
      // console.log("imageUrl :", imageUrl);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: {
        text,
        image: imageUrl,
        KeyIV: KeyIV || null,
      },
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
      // console.log("newMessage :", newMessage);
    }

    await Promise.all([conversation.save(), newMessage.save()]);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    const isQueryFromAI = trimmedText.startsWith("@ai");

    if (isQueryFromAI) {
      const prompt = trimmedText.replace("@ai", "");
      const result = await generateResult(prompt);
      // console.log("result from sendMessage controller: ", result);
      const newMessage2 = new Message({
        senderId,
        receiverId,
        isQueryFromAI: true,
        message: {
          text: result,
        },
      });

      if (newMessage2) {
        conversation.messages.push(newMessage2._id);
        // console.log("newMessage2 :", newMessage2);
      }

      await Promise.all([conversation.save(), newMessage2.save()]);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage2);
      }
      return res.status(201).json(newMessage2);
    }
    if (!isQueryFromAI) return res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json({});
    console.log("conversation from message controller :", conversation);
    res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
