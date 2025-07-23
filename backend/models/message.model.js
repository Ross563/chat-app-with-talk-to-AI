import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isQueryFromAI: {
      type: Boolean,
      default: false,
    },
    message: {
      keyIV: {
        type: [Number], // IV is also Uint8Array stored as Array
        default: null,
      },
      text: {
        type: String,
        required: function () {
          return !this.message?.image; // Require text if image is absent
        },
      },
      image: {
        type: String,
        required: function () {
          return !this.message?.text; // Require image if text is absent
        },
      },
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
