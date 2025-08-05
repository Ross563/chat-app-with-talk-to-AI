import { useRef, useState, useEffect } from "react";
import { BsFillImageFill, BsSend } from "react-icons/bs";
import useSendMessage from "../../hooks/useSendMessage";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const imageRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { loading, sendMessage } = useSendMessage();
  const { emitTyping } = useSocketContext();
  const { selectedConversation } = useConversation();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (e) => {
    const newText = e.target.value;
    setText(newText);

    if (selectedConversation?._id) {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Emit typing start
      emitTyping(selectedConversation._id, true);

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(selectedConversation._id, false);
      }, 2000);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text && !image) return;
    const trimmedText = text.trim();
    const isQueryFromAI = trimmedText.startsWith("@ai");

    const message = {
      text: isQueryFromAI ? trimmedText.replace("@ai", "") : trimmedText,
      image,
      isQueryFromAI,
    };

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      emitTyping(selectedConversation._id, false);
    }
    await sendMessage(message);

    setText("");
    setImage(null);
  };

  return (
    <>
      <form className="px-4 my-3" onSubmit={handleSubmit}>
        <div className="w-full flex justify-between items-center ">
          <input
            type="text"
            className="text-sm rounded-l-lg w-full p-2.5 bg-gray-700 text-white border-gray-700"
            placeholder="Type @ai before your question to ask from AI"
            value={text}
            onChange={handleTyping}
          />
          <div className="flex items-center gap-5 rounded-r-lg bg-gray-700 p-2.5 text-sm text-white">
            <BsFillImageFill
              size={20}
              onClick={() => imageRef.current.click()}
            />
            <input
              type="file"
              accept="image/*"
              hidden
              ref={imageRef}
              onChange={handleImageChange}
            />

            <button type="submit" className="flex items-center">
              {loading ? (
                <div className="loading loading-spinner"></div>
              ) : (
                <BsSend size={20} />
              )}
            </button>
          </div>
        </div>
      </form>
      {image && (
        <div className="ml-3 bg-gray-600 p-2.5 text-sm text-white break-words">
          Image selected: {image.name}
        </div>
      )}
    </>
  );
};
export default MessageInput;
