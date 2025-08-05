# Chat Application API Documentation

This document outlines the API endpoints used in the real-time encrypted chat application with optional AI message generation and image support.

---

## Authentication Endpoints

### POST `/api/auth/signup`

Creates a new user account.

**Request Body (JSON):**

- `fullName` (string, required): User's full name
- `email` (string, required): Unique email address
- `password` (string, required): Password (min 6 characters)
- `confirmPassword` (string, required): Must match password
- `gender` (string, required): "male" or "female"
- `publicKeyJwk` (object/string, required): User's public key in JWK format
- `encryptedPrivateKey` (string, required): Encrypted private key (Base64 string)
- `keyIV` (string, required): Initialization vector used for encryption

**Example Request:**

```json
{
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "gender": "male",
  "publicKeyJwk": { "kty": "RSA", "n": "...", "e": "AQAB" },
  "encryptedPrivateKey": "base64_encrypted_private_key",
  "keyIV": "base64_iv"
}
```

**Response:**

- Status: `201 Created`

```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "gender": "male",
  "profilePic": "https://api.dicebear.com/8.x/adventurer/svg?seed=johndoe@example.com&gender=male",
  "publicKey": { "kty": "RSA", "n": "...", "e": "AQAB" },
  "encryptedPrivateKey": "base64_encrypted_private_key",
  "keyIV": "base64_iv"
}
```

---

### POST `/api/auth/login`

Authenticates a user.

**Request Body (JSON):**

```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```

**Response:**

- Status: `200 OK`

```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "gender": "male",
  "profilePic": "https://api.dicebear.com/...svg?seed=johndoe@example.com&gender=male",
  "publicKey": { "kty": "RSA", "n": "...", "e": "AQAB" },
  "encryptedPrivateKey": "base64_encrypted_private_key",
  "keyIV": "base64_iv"
}
```

---

### POST `/api/auth/logout`

Logs out the current user.

**Authentication:** Required (JWT in HTTP-only Cookie)

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## Message Endpoints

### GET `/api/messages/:id`

Fetches all messages between the current user and a specific user by ID.

**Authentication:** Required (JWT Cookie)  
**URL Parameter:** `id` = recipient user ID

**Response:**

```json
{
  "_id": "conversation_id",
  "participants": ["user1_id", "user2_id"],
  "messages": [
    {
      "_id": "message_id",
      "senderId": "sender_id",
      "receiverId": "receiver_id",
      "isQueryFromAI": false/true,
      "message": {
        "text": "encrypted_text_message",
        "image": null/ "image_url_cloudinary",
        "keyIV": [1, 2, 3, ...]
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {}//...
  ]
}
```

---

### POST `/api/messages/send/:id`

Sends a message to a specific user. Supports text, image (base64), and encrypted messages with `keyIV`.

**Authentication:** Required  
**URL Parameter:** `id` = recipient user ID  
**Request Body (multipart/form-data):**

- `text` (string | JSON-stringified object): message content
- `keyIV` (stringified array of numbers): encryption IV (optional)
- `image` (file): optional image upload (base64)

**Example (text-only):**

```json
{
  "text": "encrypted_text_message",
  "keyIV": "[1,2,3,4,...]"
}
```

**Response:**

- Status: `201 Created`

```json
{
  "message": {
    "_id": "message_id",
    "senderId": "sender_id",
    "receiverId": "receiver_id",
    "isQueryFromAI": true/false,
    "message": {
      "text": "encrypted_text_message",
      "image": "https://res.cloudinary.com/...jpg",
      "keyIV": [1, 2, 3, ...]
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## User Endpoints

### GET `/api/users`

Fetches all users except the currently logged-in user.

**Authentication:** Required

**Response:**

```json
[
  {
    "_id": "user_id",
    "fullName": "Jane Doe",
    "gender": "female",
    "profilePic": "https://api.dicebear.com/..."
  },
  {}
  //...
]
```

---

## Error Responses

**400 Bad Request:**

```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**

```json
{
  "error": "Not authorized"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error"
}
```

---

## Notes

- All protected routes require JWT (stored in HTTP-only cookies)
- Passwords are hashed using bcrypt
- File/image uploads handled via Multer & Cloudinary
- Messages are stored encrypted using `keyIV` + `encryptedPrivateKey`
- Public key stored in JWK format
- All dates follow ISO 8601 format
- Real-time communication handled via Socket.IO (`newMessage` event)
