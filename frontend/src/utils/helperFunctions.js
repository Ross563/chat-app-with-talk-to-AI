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
    // Check if it looks like a comma-separated byte array
    if (/^\d+(,\d+)*$/.test(ciphertext.trim())) {
      ct = new Uint8Array(ciphertext.split(",").map(Number));
    } else {
      throw new Error(
        "Invalid ciphertext format: expected array or comma-separated byte string."
      );
    }
  } else if (Array.isArray(ciphertext)) {
    ct = new Uint8Array(ciphertext);
  } else if (ciphertext instanceof Uint8Array) {
    ct = ciphertext;
  } else {
    throw new Error("Unsupported ciphertext type");
  }

  const ivBytes = new Uint8Array(iv);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    sharedKey,
    ct
  );

  return new TextDecoder().decode(decrypted);
}
