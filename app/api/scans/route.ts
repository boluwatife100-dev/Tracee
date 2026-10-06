import { auth } from "@clerk/nextjs/server";
import { getScanCollection } from "@/lib/mongodb";
import type { ScanDocument } from "@/models/Scan";

export const runtime = "nodejs";

const MAX_OCR_TEXT_LENGTH = 150_000;

type ScanPayload = {
  kind: "product" | "plant";
  photoPublicIds: {
    front: string;
    back?: string;
  };
  mediaConsent: true;
  ocrText: string;
  ocrConfidence: number | null;
};

function parseScanPayload(value: unknown, userId: string): ScanPayload | null {
  if (typeof value !== "object" || value === null) return null;

  const body = value as Record<string, unknown>;
  if (body.kind !== "product" && body.kind !== "plant") return null;
  if (body.mediaConsent !== true) return null;
  if (typeof body.photoPublicIds !== "object" || body.photoPublicIds === null) {
    return null;
  }

  const photoPublicIds = body.photoPublicIds as Record<string, unknown>;
  const ownedPrefix = `${userId}_`;
  const isOwnedId = (candidate: unknown): candidate is string =>
    typeof candidate === "string" &&
    candidate.startsWith(ownedPrefix) &&
    candidate.length <= 300;

  if (!isOwnedId(photoPublicIds.front)) return null;
  if (body.kind === "product" && !isOwnedId(photoPublicIds.back)) return null;
  if (body.kind === "plant" && photoPublicIds.back !== undefined) return null;
  if (typeof body.ocrText !== "string" || body.ocrText.length > MAX_OCR_TEXT_LENGTH) {
    return null;
  }
  if (
    body.ocrConfidence !== null &&
    (typeof body.ocrConfidence !== "number" ||
      body.ocrConfidence < 0 ||
      body.ocrConfidence > 100)
  ) {
    return null;
  }

  return {
    kind: body.kind,
    photoPublicIds: {
      front: photoPublicIds.front,
      ...(body.kind === "product" ? { back: photoPublicIds.back as string } : {}),
    },
    mediaConsent: true,
    ocrText: body.kind === "product" ? body.ocrText : "",
    ocrConfidence: body.kind === "product" ? body.ocrConfidence as number | null : null,
  };
}

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

  const payload = parseScanPayload(body, userId);
  if (!payload) {
    return Response.json({ error: "Invalid scan details" }, { status: 400 });
  }

  try {
    const document: ScanDocument = {
      ...payload,
      userId,
      ocrReviewedAt: null,
      mediaConsentAt: new Date(),
      status:
        payload.kind === "product"
          ? "awaiting_catalog"
          : "awaiting_plant_diagnosis",
      createdAt: new Date(),
    };
    const scans = await getScanCollection();
    const result = await scans.insertOne(document);

    return Response.json(
      { scanId: result.insertedId.toString(), status: document.status },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save scan", error);
    return Response.json({ error: "Unable to save scan" }, { status: 500 });
  }
}