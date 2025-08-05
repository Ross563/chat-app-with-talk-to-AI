import { useEffect, useState } from "react";
import axios from "axios";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import {
  PublicJWKtoCryptoKey,
  deriveSharedKey,
  decryptMessage,
  getPrivateKeyFromIndexedDB,
} from "../utils/helperFunctions";

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
        const rawMessages = res.data.messages;
        //console.log("rawMessages from useGetMessages.js:", rawMessages);
        if (rawMessages == null || rawMessages.length === 0) {
          setMessages([]);
          setLoading(false);
          return;
        }
        if (!Array.isArray(rawMessages))
          throw new Error("Invalid message format");

        const receiverPublicKeyJwk = selectedConversation.publicKey;
        const receiverPublicCryptoKey = await PublicJWKtoCryptoKey(
          receiverPublicKeyJwk
        );
        const senderPrivateCryptoKey = await getPrivateKeyFromIndexedDB();
        // const senderPrivateCryptoKey = await PrivateJWKtoCryptoKey(
        //   senderPrivateKeyJwk
        // );
        const sharedKey = await deriveSharedKey(
          senderPrivateCryptoKey,
          receiverPublicCryptoKey
        );

        const decryptedMessages = await Promise.all(
          rawMessages.map(async (msg) => {
            try {
              // Only decrypt messages that aren't from AI
              if (!msg.isQueryFromAI || msg.isQueryFromAI === "false") {
                const iv = msg.message?.KeyIV ?? msg.message?.keyIV ?? [];
                const decryptedText = await decryptMessage(
                  sharedKey,
                  msg.message.text,
                  iv
                );
                return {
                  ...msg,
                  message: {
                    ...msg.message,
                    text: decryptedText,
                  },
                };
              } else {
                // Return AI messages as is, no decryption needed
                // console.log("Skipping decryption for AI message:", msg._id);
                return msg;
              }
            } catch (err) {
              console.error("Failed to decrypt message:", {
                error: err,
                ciphertext: msg.message.text,
                type: typeof msg.message.text,
                iv: msg.message?.KeyIV ?? msg.message?.keyIV,
                isQueryFromAI: msg.isQueryFromAI,
              });
              return msg;
            }
          })
        );

        setMessages(decryptedMessages);
      } catch (error) {
        toast.error(`error in useGetMessages hook: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, selectedConversation?.publicKey, setMessages]);
  if (!Array.isArray(messages))
    // console.log("messages from useGetMessages.js:", messages);
    return { messages: Array.isArray(messages) ? messages : [], loading };
  // return { messages, loading };
};

export default useGetMessages;
