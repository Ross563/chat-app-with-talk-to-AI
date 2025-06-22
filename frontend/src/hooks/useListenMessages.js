import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import notificationSound from "../assets/sounds/notification.mp3";

import {
  decryptMessage,
  PublicJWKtoCryptoKey,
  deriveSharedKey,
  getPrivateKeyFromIndexedDB,
} from "../utils/helperFunctions";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { messages, setMessages, selectedConversation } = useConversation();

  useEffect(() => {
    socket?.on("newMessage", async (newMessage) => {
      newMessage.shouldShake = true;

      const sound = new Audio(notificationSound);
      sound.play();

      try {
        const senderPublicKeyJWK = selectedConversation.publicKey;
        const receiverPrivateCryptoKey = await getPrivateKeyFromIndexedDB();

        if (!senderPublicKeyJWK || !receiverPrivateCryptoKey) {
          throw new Error("Missing key material for decryption.");
        }

        const senderPublicCryptoKey = await PublicJWKtoCryptoKey(
          senderPublicKeyJWK
        );
        // const receiverPrivateCryptoKey = await window.crypto.subtle.importKey(
        //   "jwk",
        //   receiverPrivateKeyJWK,
        //   { name: "ECDH", namedCurve: "P-256" },
        //   false,
        //   ["deriveKey"]
        // );

        const sharedKey = await deriveSharedKey(
          receiverPrivateCryptoKey,
          senderPublicCryptoKey
        );
        const decryptedText = await decryptMessage(
          sharedKey,
          newMessage.message.text,
          newMessage.message.keyIV
        );
        // console.log("Decrypted text:", decryptedText);
        newMessage.message.text = decryptedText;
        // console.log("newMessage from useListenMessages.js:", newMessage);
      } catch (err) {
        console.error("Failed to decrypt message:", err);
        newMessage.message.text = "[Unable to decrypt]";
      }

      const updatedMessages = [...messages, newMessage];
      // console.log("Updated messages before setMessages:", updatedMessages);

      setMessages(updatedMessages);
      // console.log("Updated messages:", messages);
    });

    return () => socket?.off("newMessage");
  }, [socket, setMessages, messages, selectedConversation]);
};

export default useListenMessages;
