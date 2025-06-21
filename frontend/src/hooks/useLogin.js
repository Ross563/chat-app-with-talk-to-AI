import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuthContext } from "../context/AuthContext";
import { decryptPrivateKey } from "../utils/storePrivateKey";
import { PrivateJWKtoCryptoKey } from "../utils/helperFunctions";

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const login = async (email, password) => {
    const success = handleInputErrors(email, password);
    if (!success) return;
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const data = res.data;
      if (data.error) throw new Error(data.error);

      // 🔓 Decrypt stored encrypted private JWK
      const privateKeyJwk = await decryptPrivateKey(
        data.encryptedPrivateKey,
        data.keyIV,
        password
      );
      console.log("privateKeyJwk from useLogin.js:", privateKeyJwk);
      // ✅ Validate required fields in JWK
      const requiredFields = ["kty", "crv", "x", "y", "d"];
      for (const field of requiredFields) {
        if (!privateKeyJwk[field]) {
          throw new Error(`Missing field "${field}" in privateKeyJwk`);
        }
      }

      // ✅ Convert to CryptoKey to verify it's valid
      await PrivateJWKtoCryptoKey(privateKeyJwk);

      // ✅ Store the JWK in IndexedDB
      // const dbRequest = window.indexedDB.open("chatKeys", 1);

      // dbRequest.onupgradeneeded = (event) => {
      //   const db = event.target.result;
      //   db.createObjectStore("keys");
      // };

      // dbRequest.onsuccess = (event) => {
      //   const db = event.target.result;
      //   const tx = db.transaction("keys", "readwrite");
      //   tx.objectStore("keys").put(privateKeyJwk, "myPrivateKey");
      // };
      const dbReq = indexedDB.open("chatKeys", 1);

      dbReq.onupgradeneeded = () => {
        const db = dbReq.result;
        db.createObjectStore("keys");
      };

      dbReq.onsuccess = () => {
        const db = dbReq.result;
        const tx = db.transaction("keys", "readwrite");
        const store = tx.objectStore("keys");
        store.put(privateKeyJwk, "myPrivateKey"); // ✅ make sure it’s the full valid JWK object
      };

      // 🔑 Set login session
      localStorage.setItem("chat-user", JSON.stringify(data));
      setAuthUser(data);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          `error in useLogin hook: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
};

export default useLogin;

function handleInputErrors(email, password) {
  if (!email || !password) {
    toast.error("Please fill in all fields");
    return false;
  }
  return true;
}

// import { useState } from "react";
// import toast from "react-hot-toast";
// import axios from "axios";
// import { useAuthContext } from "../context/AuthContext";
// import { decryptPrivateKey } from "../utils/storePrivateKey";
// import { PrivateJWKtoCryptoKey } from "../utils/helperFunctions";

// const useLogin = () => {
//   const [loading, setLoading] = useState(false);
//   const { setAuthUser } = useAuthContext();

//   const login = async (email, password) => {
//     const success = handleInputErrors(email, password);
//     if (!success) return;
//     setLoading(true);
//     try {
//       const res = await axios.post("/api/auth/login", { email, password });
//       const data = res.data;
//       if (data.error) throw new Error(data.error);

//       const privateKeyJwk = await decryptPrivateKey(
//         data.encryptedPrivateKey,
//         data.keyIV,
//         password
//       );
//       const privateCryptoKey = await PrivateJWKtoCryptoKey(privateKeyJwk);

//       const dbRequest = window.indexedDB.open("chatKeys", 1);
//       dbRequest.onupgradeneeded = (event) => {
//         const db = event.target.result;
//         db.createObjectStore("keys");
//       };
//       dbRequest.onsuccess = (event) => {
//         const db = event.target.result;
//         const tx = db.transaction("keys", "readwrite");
//         tx.objectStore("keys").put(privateCryptoKey, "myPrivateKey");
//       };

//       localStorage.setItem("chat-user", JSON.stringify(data));
//       setAuthUser(data);
//     } catch (error) {
//       toast.error(
//         error.response?.data?.error ||
//           `error in useLogin hook: ${error.message}`
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { loading, login };
// };
// export default useLogin;

// function handleInputErrors(email, password) {
//   if (!email || !password) {
//     toast.error("Please fill in all fields");
//     return false;
//   }
//   return true;
// }
