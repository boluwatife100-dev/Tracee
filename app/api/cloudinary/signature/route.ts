import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json(
      { error: "Cloudinary is not configured." },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `tracee/scans/${userId}`;
  const publicId = `${userId}_${randomUUID()}`;
  const type = "authenticated";
  const signature = cloudinary.utils.api_sign_request(
    { folder, public_id: publicId, timestamp, type },
    apiSecret
  );

  return Response.json({
    apiKey,
    cloudName,
    folder,
    publicId,
    signature,
    timestamp,
    type,
  });
}