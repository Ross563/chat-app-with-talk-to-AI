import { useEffect, useState } from "react";
import axios from "axios";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/messages/${selectedConversation._id}`
        );
        const data = res.data.messages;
        // console.log("data of messages (Array)from useGetMessages.js :", data);
        if (data.error) throw new Error(data.error);
        setMessages(data);
      } catch (error) {
        toast.error(`error in useGetMessages hook: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, setMessages]);

  return { messages, loading };
};
export default useGetMessages;
