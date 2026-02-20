import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { geminiresponse } from "../gemini.js";
import moment from "moment";

// ================= GET CURRENT USER =================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE ASSISTANT =================
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    let assistantImage;

    if (req.file) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      assistantImage = uploadResult.secure_url;
    } else if (imageUrl) {
      assistantImage = imageUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true },
    ).select("-password");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update assistant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= ASK TO ASSISTANT =================
export const asksToAssistant = async (req, res) => {
  try {
    const { command } = req.body;

    if (!command || command.trim() === "") {
      return res.status(400).json({
        message: "Command is required",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // ===== 24 Hour Auto Reset Logic =====
    const now = new Date();

    if (!user.lastReset) {
      user.lastReset = now;
      await user.save();
    }

    const lastReset = new Date(user.lastReset);

    // If date changed → reset
    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      user.replyCount = 0;
      user.lastReset = now;
      await user.save();
    }
    const MAX_REPLIES = 10;

    // Limit check
    if (user.replyCount >= MAX_REPLIES) {
      return res.status(403).json({
        message:
          "Your free limit is over. Please try next working day. Upgrade plan not available.",
        limitReached: true,
      });
    }

    const userName = user.name || "User";
    const assistantName = user.assistantName || "AssistGPT";

    const result = await geminiresponse(command, assistantName, userName);

    if (!result) {
      return res.status(400).json({
        message: "No response from assistant",
      });
    }

    const jsonMatch = result.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      return res.status(400).json({
        message: "Invalid AI response",
      });
    }

    const geminiResponse = JSON.parse(jsonMatch[0]);
    const { type, userInput, response } = geminiResponse;

    // Save messages
    user.messages.push({
      role: "user",
      text: command,
    });

    user.messages.push({
      role: "assistant",
      text: response,
    });

    // Limit message history to last 100
    if (user.messages.length > 100) {
      user.messages = user.messages.slice(-100);
    }

    // Increase reply count
    user.replyCount += 1;

    await user.save();

    return res.json({
      type,
      userInput,
      response,
      replyCount: user.replyCount,
      lastReset: user.lastReset,
    });
  } catch (error) {
    console.error("Ask assistant error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= CLEAR CHAT HISTORY =================
export const clearChatHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    user.messages = [];
    await user.save();

    res.json({ message: "History cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
