import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import Markdown from "markdown-to-jsx";
import useConversation from "../../zustand/useConversation";

const AiResponse = ({ message }) => {
  // console.log(" message.message from message.jsx :", message.message);
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();
  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe
    ? authUser.profilePic
    : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? "bg-blue-500" : "";
  const messageObject = JSON.parse(message.message.text);
  const shakeClass = message.shouldShake ? "shake" : "";

  return (
    <>
      <div className={`chat ${chatClassName}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img alt="Tailwind CSS chat bubble component" src={profilePic} />
          </div>
        </div>
        <div
          className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2 break-words`}
        >
          {messageObject.query}
        </div>
        <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
          {formattedTime}
        </div>
      </div>
      <div className={`chat chat-start`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img alt="Tailwind CSS chat bubble component" src={"/ai.jpg"} />
          </div>
        </div>
        <div
          className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2 break-words`}
        >
          AI:
          <div className={`text-white bg-zinc-800 p-2 rounded-lg break-words`}>
            <Markdown>{messageObject.response}</Markdown>
          </div>
        </div>
        <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
          {formattedTime}
        </div>
      </div>
    </>
  );
};

export default AiResponse;
