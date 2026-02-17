import express from "express";
import {
  asksToAssistant,
  getCurrentUser,
  updateAssistant,
  clearChatHistory
} from "../controllers/user.controller.js";

import isAuth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant);
userRouter.post("/asktoassistant", isAuth, asksToAssistant);
userRouter.post("/clear-history", isAuth, clearChatHistory);

export default userRouter;
