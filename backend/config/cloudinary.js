import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadonCloudinary = async (filpath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    const uploadResult = await cloudinary.uploader.upload(filpath);
    fs.unlinkSync(filpath); 
    return uploadResult.secure_url;
  } catch (error) {
    fs.unlinkSync(filpath); 
    return res.status(500).json({ message: "Cloudinary upload failed" });
  }
};
export default uploadonCloudinary;
