import { v2 as cloudinary } from "cloudinary";

export const cloudinaryEnabled = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export async function uploadImage(file: File): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "virtual-gallery" }, (err, result) =>
        err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result.secure_url),
      )
      .end(buffer);
  });
}
