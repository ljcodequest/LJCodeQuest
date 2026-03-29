import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not fully configured");
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };
}

export function getCloudinary() {
  if (!isConfigured) {
    cloudinary.config(getCloudinaryConfig());
    isConfigured = true;
  }

  return cloudinary;
}