import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import axios from "axios";
import {
  PublicJWKtoCryptoKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  getPrivateKeyFromIndexedDB,
} from "../utils/helperFunctions";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  const sendMessage = async (message) => {
    setLoading(true);
    try {
      const receiverPublicKeyJwk = selectedConversation.publicKey;

      if (!receiverPublicKeyJwk) {
        throw new Error("Receiver public key not found");
      }

      // 🔐 Get receiver's public key
      const receiverPublicCryptoKey = await PublicJWKtoCryptoKey(
        receiverPublicKeyJwk
      );

      // 🔐 Get sender's private key JWK from IndexedDB
      const senderPrivateCryptoKey = await getPrivateKeyFromIndexedDB();
      // console.log(
      //   "Sender Private crypto Key from indexedDB :",
      //   senderPrivateCryptoKey
      // );
      if (!senderPrivateCryptoKey) {
        throw new Error(
          "Sender Private crypto Key from indexedDB not found in IndexedDB"
        );
      }

      // const senderPrivateCryptoKey = await PrivateJWKtoCryptoKey(
      //   senderPrivateKeyJwk
      // );

      // 🔑 Derive shared key
      const sharedKey = await deriveSharedKey(
        senderPrivateCryptoKey,
        receiverPublicCryptoKey
      );

      // 🔒 Encrypt the message text
      if (!message.isQueryFromAI) {
        // console.log(
        //   "message.isQueryFromAI in useSendMessage.js:",
        //   message.isQueryFromAI
        // );
        const { ciphertext, iv } = await encryptMessage(
          sharedKey,
          message.text
        );
        message.text = ciphertext;
        message.keyIV = iv;
        // console.log("message.keyIV in useSendMessage.js:", message.keyIV);
        // console.log("type of iv in useSendMessage.js:", typeof iv);
        // console.log("ciphertext in useSendMessage.js: ", ciphertext);
        // console.log(
        //   "typeof ciphertext in useSendMessage.js: ",
        //   typeof ciphertext
        // );
      }
      // 📦 Prepare form data
      const formData = new FormData();
      Object.entries(message).forEach(([key, value]) => {
        // Convert arrays (like iv) to JSON string
        const isObjectOrArray = typeof value === "object" && value !== null;
        const safeValue =
          isObjectOrArray && !(value instanceof File)
            ? JSON.stringify(value)
            : value;
        formData.append(key, safeValue);
      });

      const res = await axios.post(
        `/api/messages/send/${selectedConversation._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = res.data;
      //console.log("Data from useSendMessage.js:", data);
      if (data.error) throw new Error(data.error);

      // console.log(
      //   "Encrypted message at frontend sent from backend:",
      //   data.message.text
      // );
      // console.log(
      //   "type of encrypted message at frontend sent from backend:",
      //   typeof data.message.text
      // );
      // console.log(
      //   "IV used for decryption at frontend sent from backend:",
      //   data.message.keyIV
      // );
      // console.log(
      //   "type of IV used for decryption at frontend sent from backend:",
      //   typeof data.message.keyIV
      // );
      if (!message.isQueryFromAI) {
        const decryptedMessage = await decryptMessage(
          sharedKey,
          data.message.text,
          data.message.keyIV
        );
        // console.log("Decrypted Message in useSendMessages :", decryptedMessage);
        data.message.text = decryptedMessage;
      }
      setMessages([...messages, data]);
    } catch (error) {
      console.error("Error in useSendMessage hook:", error);
      toast.error(`Message send failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendMessage;
