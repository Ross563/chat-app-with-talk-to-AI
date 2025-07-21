import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import cloudinary from "../utils/cloudinary.js";

export const sendMessage = async (req, res) => {
  try {
    // 👇 Make sure to parse if stringified
    const isQueryFromAI = req.body.isQueryFromAI;

    const keyIV =
      typeof req.body.keyIV === "string"
        ? JSON.parse(req.body.keyIV)
        : req.body.keyIV;

    // const text =
    //   typeof req.body.text === "string"
    //     ? JSON.parse(req.body.text)
    //     : req.body.text;

    const text =
      typeof req.body.text === "string"
        ? req.body.text
        : JSON.stringify(req.body.text);

    console.log("req.body.text from sendMessage controller:", req.body.text);
    console.log(
      "typeof req.body.text from sendMessage controller:",
      typeof req.body.text
    );
    console.log("keyIV from sendMessage controller: ", keyIV);
    console.log("typeof keyIV from sendMessage controller: ", typeof keyIV);
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
      isQueryFromAI,
      message: {
        text,
        image: imageUrl,
        keyIV: keyIV || null,
      },
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
      console.log("newMessage :", newMessage);
    }

    await Promise.all([conversation.save(), newMessage.save()]);
    console.log("newMessage saved to database");
    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log("receiverSocketId :", receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log("newMessage emitted to receiver");
    }

    // if (isQueryFromAI) {
    //   const ciphertextAI =
    //     typeof req.body.ciphertextAI === "string"
    //       ? req.body.ciphertextAI
    //       : JSON.parse(req.body.ciphertextAI);

    //   const keyIVAI =
    //     typeof req.body.keyIVAI === "string"
    //       ? JSON.parse(req.body.keyIVAI)
    //       : req.body.keyIVAI;

    //   // console.log("result from sendMessage controller: ", result);
    //   const newMessage2 = new Message({
    //     senderId,
    //     receiverId,
    //     isQueryFromAI: true,
    //     message: {
    //       text: ciphertextAI,
    //       keyIV: keyIVAI,
    //     },
    //   });

    //   if (newMessage2) {
    //     conversation.messages.push(newMessage2._id);
    //     console.log("newMessage2 :", newMessage2);
    //   }

    //   await Promise.all([conversation.save(), newMessage2.save()]);
    //   if (receiverSocketId) {
    //     io.to(receiverSocketId).emit("newMessage", newMessage2);
    //   }
    //   return res.status(201).json(newMessage2);
    // }
    return res.status(201).json(newMessage);
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
    // console.log("conversation from message controller :", conversation);
    res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
