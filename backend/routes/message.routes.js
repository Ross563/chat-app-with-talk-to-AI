import express from "express";
import multer from "multer";
import {
  getMessages,
  sendMessage,
} from "../controllers/message.controllers.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/:id", protectRoute, getMessages);
router.post(
  "/send/:id",
  protectRoute,
  upload.single("image"), // Ensure this matches the form-data key in frontend
  sendMessage
);

export default router;
