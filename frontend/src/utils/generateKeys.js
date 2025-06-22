export default async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );

  // Export public key (to share)
  const publicKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey
  );

  // Export private key (if you want to store locally, else just keep in memory)
  const privateKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey
  );

  console.log("Public Key:", publicKeyJwk);
  console.log("Private Key (keep secure!):", privateKeyJwk);

  return {
    publicKeyJwk,
    privateKeyJwk,
    privateCryptoKey: keyPair.privateKey,
    publicCryptoKey: keyPair.publicKey,
  };
}
