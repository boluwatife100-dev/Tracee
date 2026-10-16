import { createHash } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prisma/client";
import { hasCredits, deductCreditForAuthenticity } from "@/lib/credits";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedScanImageUrl } from "@/lib/scan-image";
import {
  AuthenticityExtractionSchema,
  extractAuthenticityFromPhotos,
} from "@/lib/extraction";
import {
  extractRegistrationNumberFromOcr,
  normalizeRegistrationNumber,
} from "@/lib/authenticity/normalization";
import { lookupNafdacProduct } from "@/lib/authenticity/nafdac-lookup";
import {
  scoreAuthenticity,
  type AuthenticityExtraction,
} from "@/lib/authenticity/scoring";
import {
  generateAuthenticityReview,
  type AuthenticityAIReview,
} from "@/lib/authenticity/ai-review";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_IMAGES = 3;
const MAX_OCR_LENGTH = 20_000;
const FOOD_REGISTRY_URL = "https://nafdac.gov.ng/food-products-database/";
const GREENBOOK_URL = "https://greenbook.nafdac.gov.ng/";

type CheckPayload = {
  photoPublicIds: Record<string, string>;
  photoContentHashes: Record<string, string>;
  ocrText: string;
  ocrConfidence: number | null;
  barcodeValue: string | null;
  manualRegistrationNumber: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parsePayload(value: unknown, userId: string): CheckPayload | null {
  const body = asRecord(value);
  const photoPublicIds = asRecord(body?.photoPublicIds);
  const photoContentHashes = asRecord(body?.photoContentHashes);
  if (
    !body ||
    body.mediaConsent !== true ||
    !photoPublicIds ||
    !photoContentHashes ||
    typeof body.ocrText !== "string" ||
    body.ocrText.length > MAX_OCR_LENGTH ||
    (body.ocrConfidence !== null &&
      (typeof body.ocrConfidence !== "number" ||
        !Number.isFinite(body.ocrConfidence) ||
        body.ocrConfidence < 0 ||
        body.ocrConfidence > 100)) ||
    (body.barcodeValue !== null &&
      (typeof body.barcodeValue !== "string" || body.barcodeValue.length > 80)) ||
    (body.manualRegistrationNumber !== undefined &&
      body.manualRegistrationNumber !== null &&
      (typeof body.manualRegistrationNumber !== "string" ||
        body.manualRegistrationNumber.length > 80))
  ) {
    return null;
  }

  const photoKeys = Object.keys(photoPublicIds);
  const ownedPrefix = `${userId}_`;
  const ownedFolderPrefix = `tracee/scans/${userId}/${ownedPrefix}`;
  if (
    photoKeys.length < 1 ||
    photoKeys.length > MAX_IMAGES ||
    photoKeys.some(
      (key) =>
        !["front", "back", "barcode"].includes(key) ||
        typeof photoPublicIds[key] !== "string" ||
        !(
          (photoPublicIds[key] as string).startsWith(ownedPrefix) ||
          (photoPublicIds[key] as string).startsWith(ownedFolderPrefix)
        ) ||
        (photoPublicIds[key] as string).length > 300
    ) ||
    Object.keys(photoContentHashes).length !== photoKeys.length ||
    photoKeys.some(
      (key) =>
        typeof photoContentHashes[key] !== "string" ||
        !/^[a-f\d]{64}$/i.test(photoContentHashes[key] as string)
    )
  ) {
    return null;
  }

  return {
    photoPublicIds: Object.fromEntries(
      photoKeys.map((key) => [key, photoPublicIds[key] as string])
    ),
    photoContentHashes: Object.fromEntries(
      photoKeys.map((key) => [
        key,
        (photoContentHashes[key] as string).toLowerCase(),
      ])
    ),
    ocrText: body.ocrText,
    ocrConfidence: body.ocrConfidence as number | null,
    barcodeValue: body.barcodeValue as string | null,
    manualRegistrationNumber:
      typeof body.manualRegistrationNumber === "string" &&
      body.manualRegistrationNumber.trim()
        ? body.manualRegistrationNumber.trim()
        : null,
  };
}

function idempotencyKey(payload: CheckPayload): string {
  const imageSet = Object.entries(payload.photoContentHashes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, hash]) => `${key}:${hash}`)
    .join("|");
  return createHash("sha256")
    .update(`${imageSet}|nafdac:${payload.manualRegistrationNumber ?? ""}`)
    .digest("hex");
}

function initialExtraction(): AuthenticityExtraction {
  return {
    nafdacRegNumber: null,
    productName: null,
    brand: null,
    manufacturerImporter: null,
    batchNumber: null,
    mfgDate: null,
    expiryDate: null,
    category: null,
    confidence: {
      nafdacRegNumber: 0,
      productName: 0,
      brand: 0,
      manufacturerImporter: 0,
      batchNumber: 0,
      mfgDate: 0,
      expiryDate: 0,
      category: 0,
    },
    unreadableFields: [
      "nafdacRegNumber",
      "productName",
      "brand",
      "manufacturerImporter",
      "batchNumber",
      "mfgDate",
      "expiryDate",
      "category",
    ],
  };
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function responseForCheck(id: string, userId: string) {
  const check = await prisma.authenticityCheck.findFirst({
    where: { id, userId },
  });
  if (!check) return null;
  return {
    id: check.id,
    status: check.status,
    state: check.state,
    reasons: check.reasons,
    aiReview: check.aiReview,
    extractedFields: check.extractedFields,
    matchedRecord: check.matchedRecord,
    frontImageUrl: getAuthenticatedScanImageUrl(check.imagePublicIds),
    registrySource: check.registrySource,
    registryAvailable: check.registryAvailable,
    nafdacRegNumber: check.nafdacRegNumber,
    barcodeValue: check.barcodeValue,
    createdAt: check.createdAt.toISOString(),
    officialUrl:
      check.registrySource === "food_db" ? FOOD_REGISTRY_URL : GREENBOOK_URL,
  };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const payload = parsePayload(body, userId);
  if (!payload) {
    return Response.json(
      { error: "Invalid authenticity check details." },
      { status: 400 }
    );
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


  const key = idempotencyKey(payload);
  let check = await prisma.authenticityCheck.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
  });
  let ownsProcessing = false;
  if (check?.status === "completed") {
    return Response.json(await responseForCheck(check.id, userId));
  }
  if (!check) {
    try {
      check = await prisma.$transaction(async (transaction) => {
        const created = await transaction.authenticityCheck.create({
          data: {
            userId,
            imagePublicIds: jsonValue(payload.photoPublicIds),
            barcodeValue: payload.barcodeValue,
            idempotencyKey: key,
            mediaConsentAt: new Date(),
            status: "extracting",
            reasons: [],
          },
        });
        await transaction.scanImage.createMany({
          data: Object.entries(payload.photoContentHashes).map(
            ([slot, contentHash]) => ({
              userId,
              contentHash,
              publicId: payload.photoPublicIds[slot],
            })
          ),
          skipDuplicates: true,
        });
        return created;
      });
      ownsProcessing = true;
    } catch (error) {
      if (asRecord(error)?.code !== "P2002") {
        console.error("Failed to create authenticity check", error);
        return Response.json(
          { error: "Unable to save the authenticity check." },
          { status: 500 }
        );
      }
      check = await prisma.authenticityCheck.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
      });
      if (!check) {
        return Response.json(
          { error: "Unable to retrieve the existing authenticity check." },
          { status: 500 }
        );
      }
    }
  }
  if (check.status === "completed") {
    return Response.json(await responseForCheck(check.id, userId));
  }
  if (check.status === "review_failed") {
    ownsProcessing = true;
    await prisma.authenticityCheck.update({
      where: { id: check.id },
      data: { status: "extracting" },
    });
  }
  if (!ownsProcessing) {
    return Response.json(
      { id: check.id, status: check.status },
      { status: 202 }
    );
  }

  let extraction = initialExtraction();
  const pipelineReasons: string[] = [];
  try {
    const extracted = await extractAuthenticityFromPhotos(
      Object.values(payload.photoPublicIds)
    );
    extraction = AuthenticityExtractionSchema.parse(extracted);
  } catch (error) {
    console.error("Authenticity label extraction failed", error);
    pipelineReasons.push(
      "The package text could not be extracted. Retake clear, well-lit photos and try again."
    );
  }

  const ocrRegistration = extractRegistrationNumberFromOcr(payload.ocrText);
  if (payload.manualRegistrationNumber) {
    extraction.nafdacRegNumber = payload.manualRegistrationNumber;
    extraction.confidence.nafdacRegNumber = 1;
    extraction.unreadableFields = extraction.unreadableFields.filter(
      (field) => field !== "nafdacRegNumber"
    );
  } else if (
    ocrRegistration &&
    (!extraction.nafdacRegNumber ||
      extraction.confidence.nafdacRegNumber < 0.55)
  ) {
    extraction.nafdacRegNumber = ocrRegistration;
    extraction.confidence.nafdacRegNumber =
      payload.ocrConfidence === null
        ? 0.55
        : Math.min(0.75, payload.ocrConfidence / 100);
    extraction.unreadableFields = extraction.unreadableFields.filter(
      (field) => field !== "nafdacRegNumber"
    );
  }
  if (!payload.manualRegistrationNumber) {
    extraction.nafdacRegNumber = normalizeRegistrationNumber(
      extraction.nafdacRegNumber
    );
  }
  const persistedExtraction = payload.manualRegistrationNumber
    ? { ...extraction, nafdacRegNumberManuallyEntered: true }
    : extraction;

  await prisma.authenticityCheck.update({
    where: { id: check.id },
    data: {
      status: "looking_up",
      extractedFields: jsonValue(persistedExtraction),
      nafdacRegNumber: extraction.nafdacRegNumber,
    },
  });

  const lookup = await lookupNafdacProduct({
    registrationNumber: extraction.nafdacRegNumber,
    productName: extraction.productName,
    manufacturer: extraction.manufacturerImporter,
    category: extraction.category,
  });
  const scored = scoreAuthenticity({
    extraction,
    lookup,
    registrationNumberOverride: payload.manualRegistrationNumber,
  });
  const reasons = [...pipelineReasons, ...scored.reasons];
  const matchedRecord = lookup.record
    ? {
        registrationNumber: lookup.record.registrationNumber,
        productName: lookup.record.productName,
        brand: lookup.record.brand,
        manufacturer: lookup.record.manufacturer,
        category: lookup.record.category,
        source: lookup.source,
        fetchedAt: lookup.fetchedAt?.toISOString() ?? null,
        raw: lookup.record.raw,
      }
    : null;

  let aiReview: AuthenticityAIReview;
  try {
    aiReview = await generateAuthenticityReview({
      state: scored.state,
      reasons: reasons.filter(
        (reason) => !/\b(?:manufacturer|applicant)\b/i.test(reason)
      ),
      registrationNumber: extraction.nafdacRegNumber,
      registrationNumberManuallyEntered: Boolean(
        payload.manualRegistrationNumber
      ),
      productName: extraction.productName,
      fieldConfidence: {
        registrationNumber: extraction.confidence.nafdacRegNumber,
        productName: extraction.confidence.productName,
        category: extraction.confidence.category,
      },
      matchedRecord: lookup.record
        ? {
            registrationNumber: lookup.record.registrationNumber,
            productName: lookup.record.productName,
            category: lookup.record.category,
          }
        : null,
      registryAvailable: lookup.available,
    });
  } catch (error) {
    console.error("Authenticity AI review failed", error);
    await prisma.authenticityCheck.update({
      where: { id: check.id },
      data: {
        status: "review_failed",
        state: scored.state,
        reasons: jsonValue(reasons),
        extractedFields: jsonValue(persistedExtraction),
        matchedRecord: matchedRecord ? jsonValue(matchedRecord) : Prisma.JsonNull,
        registrySource: lookup.source,
        registryAvailable: lookup.available,
        nafdacRegNumber: extraction.nafdacRegNumber,
        barcodeValue: payload.barcodeValue,
      },
    });
    return Response.json(
      {
        id: check.id,
        status: "review_failed",
        error: "The AI review could not be completed. Please try the check again.",
      },
      { status: 503 }
    );
  }

  try {
    await prisma.authenticityCheck.update({
      where: { id: check.id },
      data: {
        state: scored.state,
        status: "completed",
        reasons: jsonValue(reasons),
        aiReview: jsonValue(aiReview),
        extractedFields: jsonValue(persistedExtraction),
        matchedRecord: matchedRecord ? jsonValue(matchedRecord) : Prisma.JsonNull,
        registrySource: lookup.source,
        registryAvailable: lookup.available,
        nafdacRegNumber: extraction.nafdacRegNumber,
        barcodeValue: payload.barcodeValue,
      },
    });
  } catch (error) {
    console.error("Failed to save authenticity result", error);
    return Response.json(
      { error: "Unable to save the authenticity result." },
      { status: 500 }
    );
  }

  try {
    await deductCreditForAuthenticity(userId, check.id);
  } catch (creditError) {
    console.error("Failed to deduct credit for authenticity check", creditError);
  }

  return Response.json(await responseForCheck(check.id, userId), { status: 201 });
}
