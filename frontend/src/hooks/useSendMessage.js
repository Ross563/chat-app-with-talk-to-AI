import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import axios from "axios";
import {
  PublicJWKtoCryptoKey,
  PrivateJWKtoCryptoKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from "../utils/helperFunctions";

// 🔧 helper function to get private key JWK from indexedDB
const getPrivateKeyFromIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("chatKeys", 1);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("keys", "readonly");
      const store = tx.objectStore("keys");
      const getRequest = store.get("myPrivateKey");

      getRequest.onsuccess = (e) => {
        let result = e.target.result;
        // If result is a string, parse it
        if (typeof result === "string") {
          try {
            result = JSON.parse(result);
          } catch (err) {
            console.error("Failed to parse private key JWK:", err);
            return reject(new Error("Failed to parse private key JWK"));
          }
        }
        resolve(result);
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to retrieve private key from IndexedDB"));
      };
    };
  });
};

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
      const senderPrivateKeyJwk = await getPrivateKeyFromIndexedDB();
      console.log("Sender Private Key JWK:", senderPrivateKeyJwk);
      if (!senderPrivateKeyJwk) {
        throw new Error("Sender private key not found in IndexedDB");
      }

      const senderPrivateCryptoKey = await PrivateJWKtoCryptoKey(
        senderPrivateKeyJwk
      );
      console.log("Sender Private Crypto Key:", senderPrivateCryptoKey);
      // 🔑 Derive shared key
      const sharedKey = await deriveSharedKey(
        senderPrivateCryptoKey,
        receiverPublicCryptoKey
      );

      // 🔒 Encrypt the message text
      const { ciphertext, iv } = await encryptMessage(sharedKey, message.text);
      message.text = ciphertext;
      message.keyIV = iv;

      // 📦 Prepare form data
      const formData = new FormData();
      // Object.entries(message).forEach(([key, value]) =>
      //   formData.append(key, value)
      // );
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
      console.log("Data from useSendMessage.js:", data);
      if (data.error) throw new Error(data.error);

      // 🔓 Decrypt the message to show in UI
      console.log("Encrypted message from backend:", data.message.text);
      console.log("type of encrypted message:", typeof data.message.text);
      console.log("IV used for decryption:", data.message.keyIV);

      const decryptedMessage = await decryptMessage(
        sharedKey,
        data.message.text,
        data.message.keyIV
      );
      console.log("Decrypted Message in useSendMessages :", decryptedMessage);
      data.message.text = decryptedMessage;

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

// import { useState } from "react";
// import useConversation from "../zustand/useConversation";
// import toast from "react-hot-toast";
// import axios from "axios";
// import {
//   PublicJWKtoCryptoKey,
//   PrivateJWKtoCryptoKey,
//   deriveSharedKey,
//   encryptMessage,
//   decryptMessage,
// } from "../utils/helperFunctions";
// import { decryptPrivateKey } from "../utils/storePrivateKey";
// import { useAuthContext } from "../context/AuthContext";

// const useSendMessage = () => {
//   const [loading, setLoading] = useState(false);
//   const { messages, setMessages, selectedConversation } = useConversation();
//   const { authUser } = useAuthContext();
//   const encryptedSenderPrivateKey = authUser.encryptedPrivateKey;
//   const keyIV = authUser.keyIV;

//   const sendMessage = async (message) => {
//     setLoading(true);
//     try {
//       let senderPrivateKey;
//       const receiverPublicKeyJwk = selectedConversation.publicKey;
//       const receiverPublicCryptoKey = await PublicJWKtoCryptoKey(
//         receiverPublicKeyJwk
//       );

//       await window.indexedDB.open("chatKeys", 1).onsuccess = function(event) {
//       const db = event.target.result;
//       const tx = db.transaction("keys", "readonly");
//       const req = tx.objectStore("keys").get("myPrivateKey");

//       req.onsuccess = function(e) {
//         senderPrivateKey = e.target.result;
//         };
//       };
//       const senderPrivateCryptoKey=await PrivateJWKtoCryptoKey(senderPrivateKey);
//       const sharedKey = await deriveSharedKey(
//         senderPrivateCryptoKey,
//         receiverPublicCryptoKey
//       );
//       const {ciphertext,iv} = await encryptMessage(
//         sharedKey,
//         message.text
//       );
//       //const encryptedImageMessage = await encryptMessage(sharedKey, message.image);
//       message.text = ciphertext;
//       //message.image = encryptedImageMessage;
//       message.keyIV = iv;
//       const formData = new FormData();
//       Object.entries(message).forEach(([key, value]) =>
//         formData.append(key, value)
//       );

//       const res = await axios.post(
//         `/api/messages/send/${selectedConversation._id}`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );
//       const data = res.data;
//       // console.log("data from useSendMessage.js :", data);
//       const decryptedMessage = await decryptMessage(sharedKey, data.text, iv);
//       data.text = decryptedMessage;

//       // const decryptedImage = await decryptMessage(
//       //   sharedKey,
//       //   data.image,
//       //   iv
//       // );
//       // data.image = decryptedImage;
//       if (data.error) throw new Error(data.error);

//       setMessages([...messages, data]);
//     } catch (error) {
//       toast.error(`error in useSendMessage hook: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { sendMessage, loading };
// };
// export default useSendMessage;
