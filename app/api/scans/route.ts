import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

import { hasCredits } from "@/lib/credits";

export const runtime = "nodejs";

const MAX_OCR_TEXT_LENGTH = 150_000;

type ScanPayload = {
  kind: "product" | "plant";
  photoPublicIds: Record<string, string>;
  photoContentHashes: Record<string, string>;
  mediaConsent: true;
  ocrText: string;
  ocrConfidence: number | null;
  plantContext: {
    watering: string;
    light: string;
    name?: string;
    leafDescription?: string;
  } | null;
};

function parseScanPayload(value: unknown, userId: string): ScanPayload | null {
  if (typeof value !== "object" || value === null) return null;

  const body = value as Record<string, unknown>;
  if (body.kind !== "product" && body.kind !== "plant") return null;
  if (body.mediaConsent !== true) return null;
  const hasContentHashes = Object.prototype.hasOwnProperty.call(
    body,
    "photoContentHashes"
  );
  if (
    hasContentHashes &&
    (typeof body.photoContentHashes !== "object" ||
      body.photoContentHashes === null ||
      Array.isArray(body.photoContentHashes))
  ) {
    return null;
  }
  if (typeof body.photoPublicIds !== "object" || body.photoPublicIds === null) {
    return null;
  }

  const photoPublicIds = body.photoPublicIds as Record<string, unknown>;
  const photoContentHashes =
    hasContentHashes
      ? (body.photoContentHashes as Record<string, unknown>)
      : null;
  const ownedPrefix = `${userId}_`;
  const ownedFolderPrefix = `tracee/scans/${userId}/${ownedPrefix}`;
  const isOwnedId = (candidate: unknown): candidate is string =>
    typeof candidate === "string" &&
    (candidate.startsWith(ownedPrefix) ||
      candidate.startsWith(ownedFolderPrefix)) &&
    candidate.length <= 300;

  let validatedPhotoIds: Record<string, string>;
  let plantContext: ScanPayload["plantContext"] = null;
  if (body.kind === "product") {
    if (!isOwnedId(photoPublicIds.front) || !isOwnedId(photoPublicIds.back)) return null;
    validatedPhotoIds = {
      front: photoPublicIds.front,
      back: photoPublicIds.back,
    };
  } else {
    const hasNewPlantPhotos =
      isOwnedId(photoPublicIds.whole) && isOwnedId(photoPublicIds.closeUp);
    const hasLegacyPlantPhoto =
      !hasNewPlantPhotos && isOwnedId(photoPublicIds.front) && photoPublicIds.back === undefined;
    if (!hasNewPlantPhotos && !hasLegacyPlantPhoto) return null;
    if (hasNewPlantPhotos) {
      if (
        photoPublicIds.underside !== undefined &&
        !isOwnedId(photoPublicIds.underside)
      ) {
        return null;
      }
      validatedPhotoIds = {
        whole: photoPublicIds.whole as string,
        closeUp: photoPublicIds.closeUp as string,
        ...(photoPublicIds.underside
          ? { underside: photoPublicIds.underside as string }
          : {}),
      };
      const context = body.plantContext;
      if (
        typeof context !== "object" ||
        context === null ||
        typeof (context as Record<string, unknown>).watering !== "string" ||
        typeof (context as Record<string, unknown>).light !== "string"
      ) {
        return null;
      }
      const watering = (context as Record<string, string>).watering;
      const light = (context as Record<string, string>).light;
      const name = (context as Record<string, unknown>).name;
      const leafDescription = (context as Record<string, unknown>).leafDescription;
      if (
        !["daily", "every_few_days", "weekly", "rarely", "unsure"].includes(watering) ||
        !["direct", "bright_indirect", "low", "unsure"].includes(light) ||
        (name !== undefined &&
          (typeof name !== "string" || name.trim().length > 100)) ||
        (leafDescription !== undefined &&
          (typeof leafDescription !== "string" ||
            leafDescription.trim().length > 1000))
      ) {
        return null;
      }
      plantContext = {
        watering,
        light,
        ...(typeof name === "string" && name.trim()
          ? { name: name.trim() }
          : {}),
        ...(typeof leafDescription === "string" && leafDescription.trim()
          ? { leafDescription: leafDescription.trim() }
          : {}),
      };
    } else {
      validatedPhotoIds = { front: photoPublicIds.front as string };
    }
  }
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

  let validatedContentHashes: Record<string, string> = {};
  if (photoContentHashes) {
    const expectedKeys = Object.keys(
      body.kind === "product"
        ? { front: true, back: true }
        : {
            whole: true,
            closeUp: true,
            ...(validatedPhotoIds.underside ? { underside: true } : {}),
          }
    );
    if (
      Object.keys(photoContentHashes).length !== expectedKeys.length ||
      expectedKeys.some(
        (key) =>
          typeof photoContentHashes[key] !== "string" ||
          !/^[a-f\d]{64}$/i.test(photoContentHashes[key] as string)
      )
    ) {
      return null;
    }
    validatedContentHashes = Object.fromEntries(
      expectedKeys.map((key) => [
        key,
        (photoContentHashes[key] as string).toLowerCase(),
      ])
    );
  }

  return {
    kind: body.kind,
    photoPublicIds: validatedPhotoIds,
    photoContentHashes: validatedContentHashes,
    mediaConsent: true,
    ocrText: body.kind === "product" ? body.ocrText : "",
    ocrConfidence: body.kind === "product" ? (body.ocrConfidence as number | null) : null,
    plantContext,
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
  const eligible = await hasCredits(userId);
  if (!eligible) {
    return Response.json(
      {
        error: "You have used all your credits. Please purchase more credits to continue scanning.",
        code: "OUT_OF_CREDITS",
      },
      { status: 402 }
    );
  }


  try {
    const status =
      payload.kind === "product"
        ? "awaiting_catalog"
        : "awaiting_plant_diagnosis";

    const scan = await prisma.$transaction(async (transaction) => {
      const savedScan = await transaction.scan.create({
        data: {
          userId,
          kind: payload.kind,
          photoIds: payload.photoPublicIds,
          ocrText: payload.ocrText,
          ocrConfidence:
            payload.ocrConfidence === null
              ? null
              : Math.round(payload.ocrConfidence),
          ...(payload.plantContext ? { plantContext: payload.plantContext } : {}),
          mediaConsentAt: new Date(),
          status,
        },
      });

      await transaction.scanImage.createMany({
        data: Object.entries(payload.photoContentHashes).map(([key, contentHash]) => ({
          userId,
          contentHash,
          publicId: payload.photoPublicIds[key],
        })),
        skipDuplicates: true,
      });
      return savedScan;
    });

    return Response.json(
      { scanId: scan.id, status: scan.status },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save scan", error);
    return Response.json({ error: "Unable to save scan" }, { status: 500 });
  }
}
