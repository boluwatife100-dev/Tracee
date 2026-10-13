import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { extractFromPhotos, ExtractionSchema, type Extraction } from "@/lib/extraction";
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
import { ensurePendingClearance } from "@/lib/clearance";
import type {
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
      clearance: { select: { id: true, status: true, reason: true } },
    },
  });
  if (!scan) throw new ProductAnalysisNotFoundError("Product scan not found.");

  const extraction = await resolveExtraction(scan);
  const rawText = scan.ocrText ?? "";
  const labelIngredients = scan.ocrReviewedAt
    ? ingredientSection(rawText) || rawText.trim()
    : extraction?.ingredientsText?.trim() || ingredientSection(rawText);
  const ingredients = normalizeIngredients(labelIngredients);
  const ingredientConfidence = scan.ocrReviewedAt
    ? rawText.trim()
      ? 0.95
      : 0
    : extraction?.legibility.ingredients ??
      (scan.ocrConfidence === null ? 0 : scan.ocrConfidence / 100);
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

  // A label we could not read is not something to silently guess at: flag the
  // scan for review and make sure an admin clearance record exists. If the user
  // later corrects the label and ingredients appear, we stop re-flagging it.
  let clearance = scan.clearance;
  if (ingredients.length === 0) {
    try {
      clearance =
        (await ensurePendingClearance(scan.id, "insufficient_evidence")) ??
        clearance;
      await prisma.scan.updateMany({
        where: {
          id: scan.id,
          userId,
          kind: "product",
          status: "awaiting_catalog",
        },
        data: { status: "needs_review" },
      });
    } catch (error) {
      console.error("Failed to queue product scan for review", error);
    }
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
    clearance: clearance ?? null,
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
  const backPhotoId = typeof photoIds?.back === "string" ? photoIds.back : null;
  if (!backPhotoId || scan.ocrReviewedAt) return null;

  try {
    const extraction = await extractFromPhotos([backPhotoId]);
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
  const marker = /\b(?:ingredients?|composition)\s*[:\-]\s*/i.exec(text);
  if (!marker) return "";
  const start = marker.index + marker[0].length;
  const remaining = text.slice(start);
  const end = /\b(?:allergen information|allergy advice|may contain|contains|nutrition(?:al)? information|storage instructions|directions|warning|caution)\b/i.exec(remaining);
  return (end ? remaining.slice(0, end.index) : remaining).trim();
}

function findMayContainStatement(text: string): string {
  return text
    .split(/\r?\n/)
    .find((line) => /\b(?:may contain|made in a facility|processed in a facility)\b/i.test(line))
    ?.trim() ?? "";
}
