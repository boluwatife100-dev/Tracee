import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { deductCreditForScan } from "@/lib/credits";

import {
  extractFromPhotos,
  extractIngredientsFallback,
  ExtractionSchema,
  type Extraction,
} from "@/lib/extraction";
import { assessFluoride } from "@/lib/engines/flouride";
import {
  detectAllergens,
  matchUserAllergens,
} from "@/lib/engines/allergen";
import { assessDietaryPreferences } from "@/lib/engines/dietary";
import { explainIngredients } from "@/lib/engines/ingredient-explanations";
import { loadGmoReference } from "@/lib/engines/gmo-reference";
import { scoreGmo } from "@/lib/engines/gmo";
import { normalizeIngredients } from "@/lib/engines/normalize";
import type {
  ClearanceInfo,
  ProductAlert,
  ProductAnalysisResult,
  ProductVerdict,
} from "@/lib/api";

export class ProductAnalysisNotFoundError extends Error {}

// Bump when the shared analysis changes shape or its inputs change, so cached
// reports are rebuilt instead of served stale.
const ANALYSIS_VERSION = 1;

/**
 * The shareable part of a product report (verdicts + AI ingredient
 * explanations). Built once per scan and cached on `Scan.analysis`. Per-user
 * results (allergens, dietary checks) are computed at read time instead.
 */
type CachedAnalysis = {
  version: number;
  ingredientsHash: string;
  ingredientConfidence: number;
  extractedText: { inferred: string };
  gmoLikelihood: ProductVerdict;
  fluorideLikelihood: ProductVerdict;
  ingredients: ProductAnalysisResult["ingredients"];
  analysisWarnings: string[];
};

export async function getProductAnalysis(
  scanId: string,
  userId: string
): Promise<ProductAnalysisResult> {
  const scan = await prisma.scan.findFirst({
    where: { id: scanId, userId, kind: "product" },
    select: {
      id: true,
      photoIds: true,
      ocrText: true,
      ocrConfidence: true,
      ocrReviewedAt: true,
      extraction: true,
      analysis: true,
      clearance: {
        select: {
          id: true,
          status: true,
          reason: true,
          adminNote: true,
          reviewedAt: true,
        },
      },
    },
  });
  if (!scan) throw new ProductAnalysisNotFoundError("Product scan not found.");

  const extraction = await resolveExtraction(scan);
  const rawText = scan.ocrText ?? "";
  let labelIngredients = scan.ocrReviewedAt
    ? ingredientSection(rawText) || rawText.trim()
    : extraction?.ingredientsText?.trim() || ingredientSection(rawText);
  let ingredients = normalizeIngredients(labelIngredients);
  let ingredientConfidence = scan.ocrReviewedAt
    ? rawText.trim()
      ? 0.95
      : 0
    : extraction?.legibility.ingredients ??
      (scan.ocrConfidence === null ? 0 : scan.ocrConfidence / 100);

  // AI Fallback when OCR or initial extraction didn't yield ingredients:
  if (ingredients.length === 0 && !scan.ocrReviewedAt) {
    const photoIds = asRecord(scan.photoIds);
    const photoList = [photoIds?.back, photoIds?.front].filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    );
    try {
      const fallback = await extractIngredientsFallback({
        photoPublicIds: photoList,
        rawText,
      });
      if (fallback && fallback.ingredientsText) {
        const fallbackIngredients = normalizeIngredients(fallback.ingredientsText);
        if (fallbackIngredients.length > 0) {
          ingredients = fallbackIngredients;
          labelIngredients = fallback.ingredientsText;
          ingredientConfidence = Math.max(ingredientConfidence, fallback.confidence);
        }
      }
    } catch (fallbackError) {
      console.error("AI ingredient extraction fallback failed in getProductAnalysis", fallbackError);
    }
  }

  const confidence = Math.min(1, Math.max(0, ingredientConfidence));
  const claims = extraction?.claims.join(". ") ?? "";
  const productType: Extraction["productType"] = extraction?.productType ?? "other";
  const mayContainText = scan.ocrReviewedAt
    ? findMayContainStatement(rawText)
    : extraction?.mayContainText ?? findMayContainStatement(rawText);

  const ingredientsHash = hashIngredients(ingredients);
  const cached = parseCachedAnalysis(scan.analysis);
  const shared =
    cached &&
    cached.version === ANALYSIS_VERSION &&
    cached.ingredientsHash === ingredientsHash
      ? cached
      : await buildAnalysis({
          scanId: scan.id,
          ingredients,
          confidence,
          claims,
          productType,
          rawText,
          labelIngredients,
          ingredientsHash,
        });

  // Scans are only sent to the admin review queue when the user explicitly requests it.
  const clearance: ClearanceInfo | null = scan.clearance
    ? {
        id: scan.clearance.id,
        status: scan.clearance.status,
        reason: scan.clearance.reason,
        adminNote: scan.clearance.adminNote,
        reviewedAt: scan.clearance.reviewedAt
          ? scan.clearance.reviewedAt.toISOString()
          : null,
      }
    : null;

  if (ingredients.length > 0) {
    try {
      await prisma.scan.updateMany({
        where: {
          id: scan.id,
          userId,
          kind: "product",
          status: "awaiting_catalog",
        },
        data: { status: "analyzed" },
      });
    } catch (statusError) {
      console.error("Failed to update product scan status to analyzed", statusError);
    }
  }
  try {
    await deductCreditForScan(userId, scan.id);
  } catch (creditError) {
    console.error("Failed to deduct credit for product scan", creditError);
  }



  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allergies: true, dietary: true },
  });
  const savedAllergies = user?.allergies ?? [];
  const savedDietaryPreferences = user?.dietary ?? [];
  const allergenHits = detectAllergens(ingredients, mayContainText);
  const allergenMatches = matchUserAllergens(allergenHits, savedAllergies);
  const dietaryAssessments = assessDietaryPreferences(
    ingredients,
    savedDietaryPreferences
  );

  return {
    id: scan.id,
    productName: extraction?.productName?.trim() || "Scanned product",
    ingredientConfidence: shared.ingredientConfidence,
    extractedText: shared.extractedText,
    gmoLikelihood: shared.gmoLikelihood,
    fluorideLikelihood: shared.fluorideLikelihood,
    allergens: {
      hits: allergenHits,
      matches: allergenMatches,
      savedAllergies,
    },
    dietaryAssessments,
    savedDietaryPreferences,
    alerts: buildAlerts(allergenMatches, dietaryAssessments),
    ingredients: shared.ingredients,
    analysisWarnings: shared.analysisWarnings,
    imageUrl: "",
    clearance,
  };
}

async function resolveExtraction(scan: {
  id: string;
  extraction: unknown;
  photoIds: unknown;
  ocrReviewedAt: Date | null;
}): Promise<Extraction | null> {
  const savedExtraction = ExtractionSchema.safeParse(scan.extraction);
  if (savedExtraction.success) return savedExtraction.data;

  const photoIds = asRecord(scan.photoIds);
  const ids = [photoIds?.back, photoIds?.front].filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0
  );
  if (ids.length === 0 || scan.ocrReviewedAt) return null;

  try {
    const extraction = await extractFromPhotos(ids);
    try {
      await prisma.scan.update({
        where: { id: scan.id },
        data: { extraction },
      });
    } catch (error) {
      console.error("Failed to save extracted product label", error);
    }
    return extraction;
  } catch (error) {
    console.error("Failed to extract product ingredients from photo", error);
    return null;
  }
}

async function buildAnalysis({
  scanId,
  ingredients,
  confidence,
  claims,
  productType,
  rawText,
  labelIngredients,
  ingredientsHash,
}: {
  scanId: string;
  ingredients: string[];
  confidence: number;
  claims: string;
  productType: Extraction["productType"];
  rawText: string;
  labelIngredients: string;
  ingredientsHash: string;
}): Promise<CachedAnalysis> {
  const warnings: string[] = [];

  const gmoLikelihood = scoreGmo(
    {
      ingredients,
      ingredientConfidence: confidence,
      productType: "packaged",
      labelText: claims,
    },
    loadGmoReference()
  );
  const fluorideLikelihood = assessFluoride({
    ingredients,
    ingredientConfidence: confidence,
    labelText: `${rawText}\n${labelIngredients}\n${claims}`,
    productType:
      productType === "toothpaste" || productType === "mouthwash"
        ? productType
        : productType === "food" || productType === "beverage"
          ? "food"
          : "other",
  });

  let explainedIngredients: ProductAnalysisResult["ingredients"] = [];
  try {
    const explanations = await explainIngredients(ingredients, []);
    explainedIngredients = explanations.ingredients;
  } catch (error) {
    console.error("Failed to explain product ingredients", error);
    warnings.push(
      "Plain-language ingredient explanations are temporarily unavailable. The detected ingredient names are shown below."
    );
    explainedIngredients = ingredients.map((name) => ({
      name,
      explanation: "A plain-language explanation could not be generated for this ingredient.",
      role: "Ingredient on label",
    }));
  }

  const shared: CachedAnalysis = {
    version: ANALYSIS_VERSION,
    ingredientsHash,
    ingredientConfidence: confidence,
    extractedText: { inferred: labelIngredients },
    gmoLikelihood,
    fluorideLikelihood,
    ingredients: explainedIngredients,
    analysisWarnings: warnings,
  };

  try {
    await prisma.scan.update({
      where: { id: scanId },
      data: { analysis: shared },
    });
  } catch (error) {
    console.error("Failed to cache product analysis", error);
  }

  return shared;
}

function buildAlerts(
  matches: ReturnType<typeof matchUserAllergens>,
  dietaryAssessments: ProductAnalysisResult["dietaryAssessments"]
): ProductAlert[] {
  const alerts: ProductAlert[] = [];

  for (const hit of matches.mustAvoid) {
    alerts.push({
      kind: "allergen",
      severity: "high",
      title: `Contains ${hit.label}`,
      detail: `Matches your saved allergy. The label lists "${hit.matchedTerm}".`,
    });
  }
  for (const hit of matches.caution) {
    alerts.push({
      kind: "allergen",
      severity: "medium",
      title: `May contain ${hit.label}`,
      detail: `The label warns it may contain this allergen ("${hit.matchedTerm}").`,
    });
  }
  for (const assessment of dietaryAssessments) {
    if (assessment.status === "possible_conflict") {
      alerts.push({
        kind: "dietary",
        severity: "high",
        title: `Conflicts with ${assessment.preference}`,
        detail: assessment.explanation,
      });
    }
  }

  return alerts;
}

function hashIngredients(ingredients: string[]): string {
  return createHash("sha256")
    .update(`${ANALYSIS_VERSION}|${ingredients.join("|")}`)
    .digest("hex");
}

function parseCachedAnalysis(value: unknown): CachedAnalysis | null {
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.version !== "number") return null;
  if (typeof record.ingredientsHash !== "string") return null;
  if (typeof record.ingredientConfidence !== "number") return null;
  if (!asRecord(record.extractedText)) return null;
  if (!Array.isArray(record.ingredients)) return null;
  if (!Array.isArray(record.analysisWarnings)) return null;
  return record as unknown as CachedAnalysis;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function ingredientSection(text: string): string {
  const marker = /\b(?:ingredients?|composition|contains)\s*[:\-]?\s*/i.exec(text);
  if (!marker) return "";
  const start = marker.index + marker[0].length;
  const remaining = text.slice(start);
  const end = /\b(?:allergen information|allergy advice|may contain|nutrition(?:al)? information|storage instructions|directions|warning|caution)\b/i.exec(remaining);
  return (end ? remaining.slice(0, end.index) : remaining).trim();
}

function findMayContainStatement(text: string): string {
  return text
    .split(/\r?\n/)
    .find((line) => /\b(?:may contain|made in a facility|processed in a facility)\b/i.test(line))
    ?.trim() ?? "";
}
