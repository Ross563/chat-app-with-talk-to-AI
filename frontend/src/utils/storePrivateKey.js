// Helper: Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary);
}

// Helper: Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getKeyFromPassword(password) {
  const enc = new TextEncoder();
  const rawKey = enc.encode(password);
  const paddedKey = new Uint8Array(32); // 256-bit key
  paddedKey.set(rawKey.slice(0, 32));
  return await crypto.subtle.importKey(
    "raw",
    paddedKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export default async function encryptPrivateKey(privateKeyJWK, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(privateKeyJWK));

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(password);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return {
    encryptedPrivateKey: arrayBufferToBase64(encrypted),
    keyIV: arrayBufferToBase64(iv),
  };
}

export async function decryptPrivateKey(
  encryptedKeyBase64,
  ivBase64,
  password
) {
  const encryptedKey = base64ToArrayBuffer(encryptedKeyBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  const key = await getKeyFromPassword(password);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedKey
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

// export default async function encryptPrivateKey(privateKeyJwk, password) {
//   const encoder = new TextEncoder();
//   const keyData = encoder.encode(password); // convert password to bytes

//   const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, [
//     "encrypt",
//   ]);

//   const keyIV = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV

//   const encrypted = await crypto.subtle.encrypt(
//     { name: "AES-GCM", keyIV },
//     key,
//     encoder.encode(JSON.stringify(privateKeyJwk))
//   );

//   return {
//     encryptedKey: Array.from(new Uint8Array(encrypted)),
//     keyIV: Array.from(keyIV),
//   };
// }

// export async function decryptPrivateKey(encryptedKey, keyIV, password) {
//   const decoder = new TextDecoder();
//   const encoder = new TextEncoder();

//   const keyData = encoder.encode(password);

//   const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, [
//     "decrypt",
//   ]);

//   const decrypted = await crypto.subtle.decrypt(
//     {
//       name: "AES-GCM",
//       iv: new Uint8Array(keyIV),
//     },
//     key,
//     new Uint8Array(encryptedKey)
//   );

//   const jwkString = decoder.decode(decrypted);
//   return JSON.parse(jwkString); // this is your original private JWK
// }
