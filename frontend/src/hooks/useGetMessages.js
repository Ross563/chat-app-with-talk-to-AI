import { useEffect, useState } from "react";
import axios from "axios";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import {
  PublicJWKtoCryptoKey,
  PrivateJWKtoCryptoKey,
  deriveSharedKey,
  decryptMessage,
} from "../utils/helperFunctions";

// Helper to get private key from IndexedDB
const getPrivateKeyFromIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chatKeys", 1);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("keys", "readonly");
      const store = tx.objectStore("keys");
      const getRequest = store.get("myPrivateKey");
      getRequest.onsuccess = (e) => resolve(e.target.result);
      getRequest.onerror = () =>
        reject(new Error("Failed to retrieve private key"));
    };
  });
};

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
        console.log("rawMessages from useGetMessages.js:", rawMessages);
        if (!Array.isArray(rawMessages))
          throw new Error("Invalid message format");

        const receiverPublicKeyJwk = selectedConversation.publicKey;
        const receiverPublicCryptoKey = await PublicJWKtoCryptoKey(
          receiverPublicKeyJwk
        );
        const senderPrivateKeyJwk = await getPrivateKeyFromIndexedDB();
        const senderPrivateCryptoKey = await PrivateJWKtoCryptoKey(
          senderPrivateKeyJwk
        );
        const sharedKey = await deriveSharedKey(
          senderPrivateCryptoKey,
          receiverPublicCryptoKey
        );

        const decryptedMessages = await Promise.all(
          rawMessages.map(async (msg) => {
            try {
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
            } catch (err) {
              console.error("Failed to decrypt message:", {
                error: err,
                ciphertext: msg.message.text,
                type: typeof msg.message.text,
                iv: msg.message?.KeyIV ?? msg.message?.keyIV,
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
  }, [selectedConversation?._id, setMessages]);

  return { messages, loading };
};

export default useGetMessages;

// import { useEffect, useState } from "react";
// import axios from "axios";
// import useConversation from "../zustand/useConversation";
// import toast from "react-hot-toast";

// const useGetMessages = () => {
//   const [loading, setLoading] = useState(false);
//   const { messages, setMessages, selectedConversation } = useConversation();

//   useEffect(() => {
//     const getMessages = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `/api/messages/${selectedConversation._id}`
//         );
//         const data = res.data.messages;
//         // console.log("data of messages (Array)from useGetMessages.js :", data);
//         if (data.error) throw new Error(data.error);
//         setMessages(data);
//       } catch (error) {
//         toast.error(`error in useGetMessages hook: ${error.message}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (selectedConversation?._id) getMessages();
//   }, [selectedConversation?._id, setMessages]);

//   return { messages, loading };
// };
// export default useGetMessages;
