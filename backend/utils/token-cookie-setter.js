import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax", // Changed from strict to lax to allow cross-site requests in production
    secure: process.env.NODE_ENV !== "development",
    path: "/", // Ensure cookie is available for all paths
  });
};

export default generateTokenAndSetCookie;
