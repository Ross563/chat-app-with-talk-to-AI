import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/token-cookie-setter.js";

export const signup = async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, gender } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match" });
    }

    const user = await userModel.findOne({ email });

    if (user) {
      return res.status(400).json({ error: "email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPW = await bcrypt.hash(password, salt);

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${email}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${email}`;

    const userDoc = await userModel.create({
      fullName,
      email,
      gender,
      password: encryptedPW,
      profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
    });

    if (userDoc) {
      generateTokenAndSetCookie(userDoc._id, res);
      res.status(201).json({
        _id: userDoc._id,
        fullName: userDoc.fullName,
        email: userDoc.email,
        profilePic: userDoc.profilePic,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (e) {
    console.error("User registration error:", e);
    res.status(422).json({ error: "Registration failed. Please try again." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDoc = await userModel.findOne({ email });

    if (!userDoc) {
      return res.status(422).json({ error: "Email or password is incorrect" });
    }

    const isPasswordOk = bcrypt.compareSync(password, userDoc.password);

    if (!isPasswordOk) {
      return res.status(422).json({ error: "Email or password is incorrect" });
    }

    generateTokenAndSetCookie(userDoc._id, res);

    res.status(200).json({
      _id: userDoc._id,
      fullName: userDoc.fullName,
      email: userDoc.email,
      profilePic: userDoc.profilePic,
    });
  } catch (e) {
    console.error("User login error:", e);
    res.status(422).json({ error: "Login failed. Please try again." });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout:", error.message);
    res.status(422).json({ error: "Logout failed. Please try again." });
  }
};
