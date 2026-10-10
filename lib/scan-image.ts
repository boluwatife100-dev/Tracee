import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { asRecord } from "@/lib/plant-types";

export function getAuthenticatedScanImageUrl(photoIds: unknown): string | null {
  const photos = asRecord(photoIds);
  const publicId = photos?.whole ?? photos?.front;
  if (typeof publicId !== "string") return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: "image",
    transformation: [
      { width: 720, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "jpg" },
    ],
  });
}
