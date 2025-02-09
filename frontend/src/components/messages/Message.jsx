import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import AiResponse from "./AiResponse";

const Message = ({ message }) => {
  // console.log(" message.message from message.jsx :", message.message);

  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();

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
      <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
        {formattedTime}
      </div>
    </div>
  );
};

export default Message;
