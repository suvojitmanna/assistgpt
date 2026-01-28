import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { geminiresponse } from "../gemini.js";
import moment from "moment";
import { response } from "express";

// GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Send user directly (not { user: user })
    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE ASSISTANT
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    let assistantImage;

    // If user uploaded a file
    if (req.file) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      assistantImage = uploadResult.secure_url; // Cloudinary image URL
    } 
    // If user selected preset image
    else if (imageUrl) {
      assistantImage = imageUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true } // 🔥 VERY IMPORTANT
    ).select("-password");

    // ✅ Return updated user directly
    return res.status(200).json(updatedUser);

  } catch (error) {
    console.error("Update assistant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const asksToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);
    const userName = "suvojit manna" || "Your Assistant";
    const assistantName = user.assistantName || "AssistGPT";
    const result = await geminiresponse(command, assistantName, userName);
    
    const jsonNatch = result.match(/{[\s\S]*}/);
    if (!jsonNatch) {
      return res.status(400).json({ message: "Sorry i couldn't understand that." });
    }
    const geminiResponse = JSON.parse(jsonNatch[0]);
    const type = geminiResponse.type;

    switch (type) {
      case "get-date": 
        return res.json({
          type,
          userInput: geminiResponse.userInput,
          response: `Current date is ${moment().format("YYYY-MM-DD")}`,
        })                     
      case "get-time": 
        return res.json({
          type,
          userInput: geminiResponse.userInput,
          response: `Current time is ${moment().format("HH:mm:ss")}`,
        })                     
      case "get-day": 
        return res.json({
          type,
          userInput: geminiResponse.userInput,
          response: `Today is ${moment().format("dddd")}`,
        })                     
      case "get-month": 
        return res.json({
          type,
          userInput: geminiResponse.userInput,
          response: `Current month is ${moment().format("MMMM")}`,
        });
        case 'google-search':
      case 'youtube-search':
      case 'youtube-play':
      case 'instagram-open':
      case 'facebook-open':
      case 'weather-show':
      case 'general':
      case 'calculator-open':
      case 'get-news':
        return res.json({
          type,
          userInput: geminiResponse.userInput,
          response: geminiResponse.response,
        });
      default:
        return res.status(400).json({ message: "Sorry i couldn't understand that." });
    }                  
  } 
  catch (error) {
    console.error("Ask assistant error:", error);
    res.status(500).json({ message: "Server error" });
  }
}