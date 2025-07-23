import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [messageStatuses, setMessageStatuses] = useState({});
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (authUser) {
      const socket = io(import.meta.env.VITE_API_BASE_URL, {
        query: {
          userId: authUser._id,
        },
      });

      setSocket(socket);

      socket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socket.on("userTyping", ({ senderId, isTyping }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [senderId]: isTyping,
        }));
      });

      socket.on("messageStatusUpdate", ({ messageId, status }) => {
        setMessageStatuses((prev) => ({
          ...prev,
          [messageId]: status,
        }));
      });

      return () => socket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  const emitTyping = (receiverId, isTyping) => {
    if (socket) {
      socket.emit("typing", { receiverId, isTyping });
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, typingUsers, emitTyping, messageStatuses }}
    >
      {children}
    </SocketContext.Provider>
  );
};
