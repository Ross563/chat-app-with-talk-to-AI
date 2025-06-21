import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuthContext } from "../context/AuthContext";
import generateKeyPair from "../utils/generateKeys";
import encryptPrivateKey from "../utils/storePrivateKey";
import { PrivateJWKtoCryptoKey } from "../utils/helperFunctions";

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
      const { publicKey, privateKey } = await generateKeyPair();
      const privateCryptoKey = await PrivateJWKtoCryptoKey(privateKey);

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
        privateKey,
        password
      );

      const res = await axios.post("/api/auth/signup", {
        fullName,
        email,
        password,
        publicKey,
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

// import { useState } from "react";
// import toast from "react-hot-toast";
// import axios from "axios";
// import { useAuthContext } from "../context/AuthContext";
// import generateKeyPair from "../utils/generateKeys";
// import encryptPrivateKey from "../utils/storePrivateKey";
// import { PrivateJWKtoCryptoKey } from "../utils/helperFunctions";

// const useSignup = () => {
//   const [loading, setLoading] = useState(false);
//   const { setAuthUser } = useAuthContext();

//   const signup = async ({
//     fullName,
//     email,
//     password,
//     confirmPassword,
//     gender,
//   }) => {
//     const success = handleInputErrors({
//       fullName,
//       email,
//       password,
//       confirmPassword,
//       gender,
//     });
//     if (!success) return;

//     setLoading(true);
//     try {
//       // 🔐 Generate key pair
//       const { publicKey, privateKey } = await generateKeyPair();

//       // 🧱 Convert private key JWK to CryptoKey
//       const privateCryptoKey = await PrivateJWKtoCryptoKey(privateKey);

//       // 💾 Store private key JWK in IndexedDB
//       await storePrivateKeyInIndexedDB(privateKey);

//       // 🔒 Encrypt private key with password
//       const { encryptedPrivateKey, keyIV } = await encryptPrivateKey(
//         privateCryptoKey,
//         password
//       );

//       // 📨 Send signup data to server
//       const res = await axios.post("/api/auth/signup", {
//         fullName,
//         email,
//         password,
//         publicKey,
//         encryptedPrivateKey,
//         keyIV,
//         confirmPassword,
//         gender,
//       });

//       const data = res.data;
//       if (data.error) throw new Error(data.error);

//       // ✅ Save session locally
//       localStorage.setItem("chat-user", JSON.stringify(data));
//       setAuthUser(data);
//     } catch (error) {
//       toast.error(`Signup failed: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { loading, signup };
// };

// export default useSignup;

// function handleInputErrors({
//   fullName,
//   email,
//   password,
//   confirmPassword,
//   gender,
// }) {
//   if (!fullName || !email || !password || !confirmPassword || !gender) {
//     toast.error("Please fill in all fields");
//     return false;
//   }

//   if (password !== confirmPassword) {
//     toast.error("Passwords do not match");
//     return false;
//   }

//   if (password.length < 6) {
//     toast.error("Password must be at least 6 characters");
//     return false;
//   }

//   return true;
// }

// // ✅ Helper to store private key JWK in IndexedDB
// async function storePrivateKeyInIndexedDB(jwk) {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open("chatKeys", 1);

//     request.onupgradeneeded = function (event) {
//       const db = event.target.result;
//       if (!db.objectStoreNames.contains("keys")) {
//         db.createObjectStore("keys");
//       }
//     };

//     request.onsuccess = function (event) {
//       const db = event.target.result;
//       const tx = db.transaction("keys", "readwrite");
//       const store = tx.objectStore("keys");

//       const putReq = store.put(jwk, "myPrivateKey");

//       putReq.onsuccess = () => resolve();
//       putReq.onerror = () => reject(new Error("Failed to store private key"));
//     };

//     request.onerror = () => {
//       reject(new Error("Failed to open IndexedDB"));
//     };
//   });
// }

// import { useState } from "react";
// import toast from "react-hot-toast";
// import axios from "axios";
// import { useAuthContext } from "../context/AuthContext";
// import generateKeyPair from "../utils/generateKeys";
// import encryptPrivateKey from "../utils/storePrivateKey";
// import { PrivateJWKtoCryptoKey } from "..utils/helperFunctions";

// const useSignup = () => {
//   const [loading, setLoading] = useState(false);
//   const { setAuthUser } = useAuthContext();

//   const signup = async ({
//     fullName,
//     email,
//     password,
//     confirmPassword,
//     gender,
//   }) => {
//     const success = handleInputErrors({
//       fullName,
//       email,
//       password,
//       confirmPassword,
//       gender,
//     });
//     if (!success) return;

//     setLoading(true);
//     try {
//       const { publicKey, privateKey } = await generateKeyPair();
//       const privateCryptoKey = await PrivateJWKtoCryptoKey(privateKey);

//       await window.indexedDB.open("chatKeys", 1).onsuccess = function(event) {
//         const db = event.target.result;
//         const tx = db.transaction("keys", "readwrite");
//         tx.objectStore("keys").put(privateCryptoKey, "myPrivateKey");
//       };

//       const { encryptedPrivateKey, keyIV } = await encryptPrivateKey(
//         privateCryptoKey,
//         password
//       );

//       const res = await axios.post("/api/auth/signup", {
//         fullName,
//         email,
//         password,
//         publicKey,
//         encryptedPrivateKey,
//         keyIV,
//         confirmPassword,
//         gender,
//       });

//       const data = res.data;
//       if (data.error) {
//         throw new Error(data.error);
//       }
//       localStorage.setItem("chat-user", JSON.stringify(data));
//       setAuthUser(data);
//     } catch (error) {
//       toast.error(`error in useSignUp hook: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { loading, signup };
// };
// export default useSignup;

// function handleInputErrors({
//   fullName,
//   email,
//   password,
//   confirmPassword,
//   gender,
// }) {
//   if (!fullName || !email || !password || !confirmPassword || !gender) {
//     toast.error("Please fill in all fields");
//     return false;
//   }

//   if (password !== confirmPassword) {
//     toast.error("Passwords do not match");
//     return false;
//   }

//   if (password.length < 6) {
//     toast.error("Password must be at least 6 characters");
//     return false;
//   }

//   return true;
// }
