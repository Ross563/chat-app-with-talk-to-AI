import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },
    profilePic: {
      type: String,
      default: "",
    },
    publicKey: {
      type: Object, // Will store the JWK format
      default: null,
    },
    encryptedPrivateKey: {
      type: String, // Change from [Number] to String (Base64)
      default: null,
    },
    keyIV: {
      type: String, // Also change this from [Number] to String
      default: null,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
