import {
  fuzzyNameMatches,
  normalizeRegistrationNumber,
} from "./normalization";

export const AUTHENTICITY_STATES = [
  "VERIFIED_REGISTRATION",
  "MISMATCH",
  "NOT_FOUND",
  "INSUFFICIENT_EVIDENCE",
] as const;

export type AuthenticityState = (typeof AUTHENTICITY_STATES)[number];
export type ExtractedField =
  | "nafdacRegNumber"
  | "productName"
  | "brand"
  | "manufacturerImporter"
  | "batchNumber"
  | "mfgDate"
  | "expiryDate"
  | "category";

export type AuthenticityExtraction = {
  nafdacRegNumber: string | null;
  productName: string | null;
  brand: string | null;
  manufacturerImporter: string | null;
  batchNumber: string | null;
  mfgDate: string | null;
  expiryDate: string | null;
  category: string | null;
  confidence: Record<ExtractedField, number>;
  unreadableFields: ExtractedField[];
};

export type ScoringRecord = {
  registrationNumber: string;
  productName: string;
  brand: string | null;
  manufacturer: string | null;
  category: string | null;
};

export type ScoringMatchBasis =
  | "registration"
  | "manufacturer_and_product"
  | "manufacturer"
  | "none";

export type ScoringLookup = {
  found: boolean;
  record: ScoringRecord | null;
  available: boolean | null;
  source?: string | null;
  matchBasis?: ScoringMatchBasis;
  manufacturerFound?: boolean;
  manufacturerProducts?: string[];
};

export type AuthenticityScore = {
  state: AuthenticityState;
  reasons: string[];
  confidence: number;
  lookupAvailable: boolean | null;
};

function normalizeCategory(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (
    ["food", "foods", "beverage", "beverages", "foodandbeverages"].includes(
      normalized
    )
  ) {
    return "food";
  }
  if (["drug", "drugs", "medicine", "medicines", "pharmaceutical"].includes(normalized)) {
    return "drug";
  }
  if (["cosmetic", "cosmetics", "beauty"].includes(normalized)) return "cosmetic";
  if (["medicaldevice", "medicaldevices"].includes(normalized)) return "medical device";
  return normalized;
}

function alphanumeric(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function confidenceOf(extraction: AuthenticityExtraction): number {
  const comparable: ExtractedField[] = [
    "nafdacRegNumber",
    "productName",
    "manufacturerImporter",
    "category",
  ];
  const scores = comparable
    .filter((field) => extraction[field] !== null)
    .map((field) => extraction.confidence[field]);
  return scores.length
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100)
    : 0;
}

function parseLabelDate(value: string | null): Date | null {
  if (!value) return null;
  const cleaned = value.trim();
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  const dayMonthYear = cleaned.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);
  if (dayMonthYear) {
    return new Date(
      Date.UTC(Number(dayMonthYear[3]), Number(dayMonthYear[2]) - 1, Number(dayMonthYear[1]))
    );
  }
  const monthYear = cleaned.match(/^(\d{1,2})[/. -](\d{4})$/);
  if (monthYear) {
    return new Date(Date.UTC(Number(monthYear[2]), Number(monthYear[1]), 0));
  }
  return null;
}

function addPackagingReasons(
  extraction: AuthenticityExtraction,
  reasons: string[],
  now: Date
): void {
  if (!extraction.batchNumber?.trim()) {
    reasons.push("No readable batch number was found; check the package before use.");
  }

  const manufactureDate = parseLabelDate(extraction.mfgDate);
  const expiryDate = parseLabelDate(extraction.expiryDate);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (manufactureDate && manufactureDate.getTime() > today) {
    reasons.push("The printed manufacture date appears to be in the future.");
  }
  if (
    manufactureDate &&
    expiryDate &&
    expiryDate.getTime() < manufactureDate.getTime()
  ) {
    reasons.push("The printed expiry date is earlier than the manufacture date.");
  }
  if (expiryDate && expiryDate.getTime() < today) {
    reasons.push("The printed expiry date has passed; do not use this product.");
  }
}

function insufficient(
  reasons: string[],
  confidence: number,
  lookupAvailable: boolean | null
): AuthenticityScore {
  return {
    state: "INSUFFICIENT_EVIDENCE",
    reasons,
    confidence,
    lookupAvailable,
  };
}

/**
 * Context from the company-name lookup. This explains and guides; it never
 * verifies a product, because a company name is easy to copy onto a fake pack.
 */
function companyEvidence(
  extraction: AuthenticityExtraction,
  lookup: ScoringLookup,
  basis: ScoringMatchBasis
): string[] {
  const company = extraction.manufacturerImporter?.trim() || "The printed company";
  if (basis === "manufacturer_and_product" && lookup.record) {
    return [
      `${company} is listed with NAFDAC, and "${lookup.record.productName}" is registered under it with number ${lookup.record.registrationNumber}. Check that this matches the number printed on the pack.`,
    ];
  }
  if (basis === "manufacturer") {
    const products = (lookup.manufacturerProducts ?? []).slice(0, 5);
    return [
      `${company} is listed with NAFDAC, but this product was not found under it${
        products.length ? ` (registered products include: ${products.join(", ")})` : ""
      }.`,
    ];
  }
  return [];
}

export function scoreAuthenticity(input: {
  extraction: AuthenticityExtraction;
  lookup: ScoringLookup;
  registrationNumberOverride?: string | null;
  now?: Date;
}): AuthenticityScore {
  const { extraction, lookup } = input;
  const confidence = confidenceOf(extraction);
  const reasons: string[] = [];
  addPackagingReasons(extraction, reasons, input.now ?? new Date());

  const basis: ScoringMatchBasis =
    lookup.matchBasis ?? (lookup.found ? "registration" : "none");
  const companyReasons = companyEvidence(extraction, lookup, basis);

  const registrationNumber =
    input.registrationNumberOverride?.trim() ||
    normalizeRegistrationNumber(extraction.nafdacRegNumber);
  if (
    !registrationNumber ||
    (!input.registrationNumberOverride &&
      extraction.confidence.nafdacRegNumber < 0.55)
  ) {
    reasons.unshift(
      "The NAFDAC registration number could not be read clearly; retake the label photo.",
      ...companyReasons
    );
    return insufficient(reasons, confidence, lookup.available);
  }
  if (lookup.available === false) {
    reasons.unshift(
      "The NAFDAC registry could not be reached, so this product could not be verified.",
      ...companyReasons
    );
    return insufficient(reasons, confidence, false);
  }
  if (!lookup.found || !lookup.record || basis !== "registration") {
    reasons.unshift(
      "No matching registration number was found in the available NAFDAC records.",
      ...companyReasons
    );
    return {
      state: "NOT_FOUND",
      reasons,
      confidence,
      lookupAvailable: true,
    };
  }

  const record = lookup.record;
  // Registry numbers may be punctuated differently; compare letters and digits only.
  if (alphanumeric(record.registrationNumber) !== alphanumeric(registrationNumber)) {
    reasons.unshift(
      "The registry result uses a different registration number than the package."
    );
    return {
      state: "MISMATCH",
      reasons,
      confidence,
      lookupAvailable: true,
    };
  }

  const requiredFields: ExtractedField[] = [
    "productName",
    "manufacturerImporter",
    "category",
  ];
  const unavailableFields = requiredFields.filter(
    (field) =>
      !extraction[field]?.trim() ||
      extraction.confidence[field] < 0.55 ||
      extraction.unreadableFields.includes(field)
  );
  if (
    unavailableFields.length ||
    !record.productName ||
    !record.manufacturer ||
    !record.category
  ) {
    reasons.unshift(
      "The printed product details or registry fields are incomplete, so a reliable comparison was not possible."
    );
    return insufficient(reasons, confidence, true);
  }

  const nameMatches =
    fuzzyNameMatches(extraction.productName!, record.productName) ||
    Boolean(
      extraction.brand &&
        (fuzzyNameMatches(extraction.brand, record.productName) ||
          (record.brand && fuzzyNameMatches(extraction.brand, record.brand)))
    );
  const manufacturerMatches = fuzzyNameMatches(
    extraction.manufacturerImporter!,
    record.manufacturer
  );
  const extractedCategory = normalizeCategory(extraction.category!);
  const recordCategory = normalizeCategory(record.category);
  // Food-database rows carry sub-categories such as "Bakery products", so any record
  // from that registry is food by definition.
  const categoryMatches =
    extractedCategory === recordCategory ||
    (extractedCategory === "food" &&
      (recordCategory.includes("food") || lookup.source === "food_db"));

  const comparisonReasons: string[] = [];
  if (!nameMatches) {
    comparisonReasons.push(
      "The registration number is listed, but the registered product name differs from the package."
    );
  }
  if (!manufacturerMatches) {
    comparisonReasons.push(
      "The registration number is listed, but the manufacturer or importer differs from the package."
    );
  }
  if (!categoryMatches) {
    comparisonReasons.push(
      "The registered product category differs from the category printed on the package."
    );
  }
  if (comparisonReasons.length) {
    return {
      state: "MISMATCH",
      reasons: [...comparisonReasons, ...reasons],
      confidence,
      lookupAvailable: true,
    };
  }

  reasons.unshift(
    "The registration number, product name, manufacturer, and category match the registry record."
  );
  return {
    state: "VERIFIED_REGISTRATION",
    reasons,
    confidence,
    lookupAvailable: true,
  };
}