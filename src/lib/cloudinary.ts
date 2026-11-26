import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set its server-side environment variables.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export async function uploadScanImage(file: File) {
  const client = getCloudinary();
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return client.uploader.upload(`data:${file.type};base64,${base64}`, {
    folder: "karigar/scans",
    resource_type: "image",
    overwrite: false,
    unique_filename: true,
  });
}
