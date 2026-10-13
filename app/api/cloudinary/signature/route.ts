import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const contentHash =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).contentHash
      : null;
  if (typeof contentHash !== "string" || !/^[a-f\d]{64}$/i.test(contentHash)) {
    return Response.json({ error: "Invalid photo content hash." }, { status: 400 });
  }
  const normalizedContentHash = contentHash.toLowerCase();

  const existingImage = await prisma.scanImage.findUnique({
    where: {
      userId_contentHash: { userId, contentHash: normalizedContentHash },
    },
    select: { publicId: true },
  });
  if (existingImage) {
    return Response.json({ publicId: existingImage.publicId, reused: true });
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