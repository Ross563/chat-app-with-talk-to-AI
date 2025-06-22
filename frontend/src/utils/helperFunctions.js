export async function PublicJWKtoCryptoKey(publicKeyJwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

export const getPrivateKeyFromIndexedDB = () => {
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
        if (typeof result === "string") {
          try {
            result = JSON.parse(result);
          } catch (err) {
            console.error("Failed to parse private key JWK:", err);
            return reject(new Error("Invalid private key format"));
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

export async function PrivateJWKtoCryptoKey(privateKeyJwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey"]
  );
}

export async function deriveSharedKey(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(sharedKey, plainText) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // random 12-byte IV

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    sharedKey,
    encoder.encode(plainText)
  );

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encrypted)),
  };
}

export async function decryptMessage(sharedKey, ciphertext, iv) {
  let ct;

  if (typeof ciphertext === "string") {
    try {
      const parsed = JSON.parse(ciphertext);
      if (Array.isArray(parsed)) {
        ct = new Uint8Array(parsed);
      } else {
        throw new Error("Parsed ciphertext is not an array");
      }
    } catch (e) {
      console.error("Failed to parse ciphertext JSON:", e);
      throw new Error("Ciphertext JSON parsing failed");
    }
  } else if (Array.isArray(ciphertext)) {
    ct = new Uint8Array(ciphertext);
  } else if (ciphertext instanceof Uint8Array) {
    ct = ciphertext;
  } else {
    throw new Error("Unsupported ciphertext format");
  }

  const ivBytes = Array.isArray(iv) ? new Uint8Array(iv) : iv;

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    sharedKey,
    ct
  );

  return new TextDecoder().decode(decrypted);
}
