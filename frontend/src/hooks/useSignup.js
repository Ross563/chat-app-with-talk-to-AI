import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuthContext } from "../context/AuthContext";
import generateKeyPair from "../utils/generateKeys";
import encryptPrivateKey from "../utils/storePrivateKey";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const signup = async ({
    fullName,
    email,
    password,
    confirmPassword,
    gender,
  }) => {
    const success = handleInputErrors({
      fullName,
      email,
      password,
      confirmPassword,
      gender,
    });
    if (!success) return;

    setLoading(true);
    try {
      const { publicKeyJwk, privateKeyJwk, privateCryptoKey } =
        await generateKeyPair();
      console.log("Generated keys:", {
        publicKeyJwk,
        privateKeyJwk,
        privateCryptoKey,
      });
      const dbRequest = window.indexedDB.open("chatKeys", 1);
      dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore("keys");
      };
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction("keys", "readwrite");
        tx.objectStore("keys").put(privateCryptoKey, "myPrivateKey");
      };

      const { encryptedPrivateKey, keyIV } = await encryptPrivateKey(
        privateKeyJwk,
        password
      );

      const res = await axios.post("/api/auth/signup", {
        fullName,
        email,
        password,
        publicKeyJwk,
        encryptedPrivateKey,
        keyIV,
        confirmPassword,
        gender,
      });

      const data = res.data;
      if (data.error) throw new Error(data.error);

      localStorage.setItem("chat-user", JSON.stringify(data));
      setAuthUser(data);
    } catch (error) {
      toast.error(`error in useSignup hook: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { loading, signup };
};
export default useSignup;

function handleInputErrors({
  fullName,
  email,
  password,
  confirmPassword,
  gender,
}) {
  if (!fullName || !email || !password || !confirmPassword || !gender) {
    toast.error("Please fill in all fields");
    return false;
  }
  if (password !== confirmPassword) {
    toast.error("Passwords do not match");
    return false;
  }
  if (password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return false;
  }
  return true;
}
