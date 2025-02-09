import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import axios from "axios";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  const sendMessage = async (message) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(message).forEach(([key, value]) =>
        formData.append(key, value)
      );

      const res = await axios.post(
        `/api/messages/send/${selectedConversation._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const data = res.data;
      // console.log("data from useSendMessage.js :", data);
      if (data.error) throw new Error(data.error);

      setMessages([...messages, data]);
    } catch (error) {
      toast.error(`error in useSendMessage hook: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};
export default useSendMessage;
