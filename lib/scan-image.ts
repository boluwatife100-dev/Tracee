import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { asRecord } from "@/lib/plant-types";

/**
 * Build a short-lived signed URL for a single authenticated Cloudinary image.
 * Returns null when the public id is missing or Cloudinary is not configured.
 */
export function getAuthenticatedImageUrl(
  publicId: unknown,
  width = 720
): string | null {
  if (typeof publicId !== "string" || !publicId) return null;

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
      { width, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "jpg" },
    ],
  });
}

export function getAuthenticatedScanImageUrl(photoIds: unknown): string | null {
  const photos = asRecord(photoIds);
  return getAuthenticatedImageUrl(photos?.whole ?? photos?.front);
}
