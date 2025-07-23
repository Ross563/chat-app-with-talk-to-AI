import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import AiResponse from "./AiResponse";
import { useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { BsCheck, BsCheckAll } from "react-icons/bs";

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();
  const { socket, messageStatuses } = useSocketContext();

  useEffect(() => {
    if (message.senderId !== authUser._id && message.status !== "seen") {
      socket?.emit("messageSeen", {
        messageId: message._id,
        receiverId: message.senderId,
      });
    } else if (message.senderId !== authUser._id && message.status === "sent") {
      socket?.emit("messageDelivered", {
        messageId: message._id,
        receiverId: message.senderId,
      });
    }
  }, [message, authUser._id, socket]);

  if (message.isQueryFromAI) {
    return <AiResponse message={message} />;
  }

  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe
    ? authUser.profilePic
    : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? "bg-blue-500" : "";
  const shakeClass = message.shouldShake ? "shake" : "";

  const MessageStatus = () => {
    if (!fromMe) return null;

    const currentStatus = messageStatuses[message._id] || message.status;

    const getStatusIcon = () => {
      switch (currentStatus) {
        case "sent":
          return <BsCheck className="text-gray-200" size={16} />;
        case "delivered":
          return <BsCheckAll className="text-gray-200" size={16} />;
        case "seen":
          return <BsCheckAll className="text-blue-700" size={16} />;
        default:
          return null;
      }
    };

    return <span className="ml-2">{getStatusIcon()}</span>;
  };

  return (
    <div className={`chat ${chatClassName}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img alt="Tailwind CSS chat bubble component" src={profilePic} />
        </div>
      </div>
      {!message.message.image && message.message.text && (
        <div
          className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2 break-words`}
        >
          {message.message.text}
        </div>
      )}
      {!message.message.text && message.message.image && (
        <div
          className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}
        >
          <img
            src={message.message.image}
            alt="chat"
            className="max-w-[10rem] max-h-[10rem]"
          />
        </div>
      )}
      {message.message.text && message.message.image && (
        <div
          className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}
        >
          <img
            src={message.message.image}
            alt="chat"
            className="max-w-[10rem] max-h-[10rem]"
          />
          <p className="break-words">{message.message.text}</p>
        </div>
      )}
      <div className="chat-footer opacity-50 text-xs flex gap-1 items-center bg-white rounded-md p-1 text-gray-700">
        {formattedTime}
        <MessageStatus />
      </div>
    </div>
  );
};

export default Message;
