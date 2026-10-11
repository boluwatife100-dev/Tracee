export const NAFDAC_REGISTRATION_PATTERN =
  /^(?:[A-Z]\d{1,2}|\d{1,2})-\d{3,8}[A-Z]?$/;

/**
 * State-office style numbers printed on some locally produced goods,
 * e.g. LA/0385B/KTU (office code / serial + optional letter / zone code).
 * Derived from labels seen so far; widen if you meet other variants.
 */
export const NAFDAC_STATE_PATTERN =
  /^[A-Z]{2,3}\/\d{2,6}[A-Z]?(?:\/[A-Z]{2,5}){1,2}$/;

export type RegistrationFormat = "standard" | "state_office";

export type ParsedRegistration = {
  value: string;
  format: RegistrationFormat;
};

const DASHES = /[‐‑‒–—]/g;

function fixNumericSegment(segment: string): string {
  // Only repair O/I confusion in the digit run, never the trailing letter.
  const match = segment.match(/^([0-9OI]{2,8})([A-Z]?)$/);
  if (!match) return segment;
  const digits = match[1].replace(/O/g, "0").replace(/I/g, "1");
  return `${digits}${match[2]}`;
}

export function parseRegistrationNumber(
  value: string | null | undefined
): ParsedRegistration | null {
  if (!value) return null;
  const compact = value
    .trim()
    .toUpperCase()
    .replace(DASHES, "-")
    .replace(/\\/g, "/")
    .replace(/\s+/g, "");

  if (compact.includes("/")) {
    const parts = compact.split("/");
    if (parts.length < 3 || parts.length > 4) return null;
    const [office, serial, ...zones] = parts;
    const normalized = [office, fixNumericSegment(serial), ...zones].join("/");
    return NAFDAC_STATE_PATTERN.test(normalized)
      ? { value: normalized, format: "state_office" }
      : null;
  }

  const separatorIndex = compact.indexOf("-");
  const prefix =
    separatorIndex >= 0 ? compact.slice(0, separatorIndex) : compact.slice(0, 2);
  const suffix =
    separatorIndex >= 0 ? compact.slice(separatorIndex + 1) : compact.slice(2);
  const normalizedPrefix = prefix.replace(/[OI]/g, (character) =>
    character === "O" && /^[A-Z]/.test(prefix) ? "O" : character === "O" ? "0" : "1"
  );
  const normalizedSuffix = suffix.replace(/[OI]/g, (character) =>
    character === "O" ? "0" : "1"
  );
  const normalized = `${normalizedPrefix}-${normalizedSuffix}`.replace(/[^A-Z0-9-]/g, "");
  return NAFDAC_REGISTRATION_PATTERN.test(normalized)
    ? { value: normalized, format: "standard" }
    : null;
}

export function normalizeRegistrationNumber(value: string | null | undefined): string | null {
  return parseRegistrationNumber(value)?.value ?? null;
}

const STATE_CANDIDATE =
  /^([A-Z]{2,3})\s*[\/\\]\s*([0-9OI]{2,6}[A-Z]?)\s*[\/\\]\s*([A-Z]{2,5})(?:\s*[\/\\]\s*([A-Z]{2,5}))?/i;
const STANDARD_CANDIDATE =
  /^([A-Z]?[0-9OI]{1,2})\s*[-‐‑‒–—]\s*([0-9OI]{3,8}[A-Z]?)/i;
const LABEL =
  /NAFDAC(?:\s*(?:REG(?:ISTRATION)?\.?(?:\s*(?:NO\.?|NUMBER))?|NO\.?))?[\s:#.\-]{0,12}/gi;
const UNLABELED_STATE =
  /\b[A-Z]{2,3}\s*\/\s*[0-9OI]{2,6}[A-Z]?\s*\/\s*[A-Z]{2,5}\b/i;

function parseCandidate(window: string): string | null {
  const state = window.match(STATE_CANDIDATE);
  if (state) {
    const joined = state.slice(1).filter(Boolean).join("/");
    const parsed = normalizeRegistrationNumber(joined);
    if (parsed) return parsed;
  }
  const standard = window.match(STANDARD_CANDIDATE);
  if (standard) {
    const parsed = normalizeRegistrationNumber(`${standard[1]}-${standard[2]}`);
    if (parsed) return parsed;
  }
  // Legacy behaviour: hyphen-less numbers such as "A11234".
  const legacy = window.match(/^[A-Z0-9][A-Z0-9\s‐‑‒–—-]{3,18}/i);
  return legacy ? normalizeRegistrationNumber(legacy[0]) : null;
}

export function extractRegistrationNumberFromOcr(text: string): string | null {
  for (const label of text.matchAll(LABEL)) {
    const start = (label.index ?? 0) + label[0].length;
    const parsed = parseCandidate(text.slice(start, start + 40));
    if (parsed) return parsed;
  }
  // The label word is often misread by OCR; the slash format is distinctive enough.
  const unlabeled = text.match(UNLABELED_STATE);
  return unlabeled ? normalizeRegistrationNumber(unlabeled[0]) : null;
}

const COMPANY_SUFFIXES = new Set([
  "co",
  "company",
  "corp",
  "corporation",
  "inc",
  "incorporated",
  "limited",
  "llc",
  "ltd",
  "nigeria",
  "nig",
  "plc",
]);

const GENERIC_BUSINESS_WORDS = new Set([
  "bakery",
  "bakeries",
  "food",
  "foods",
  "industries",
  "industry",
  "ventures",
  "enterprises",
  "enterprise",
  "global",
  "group",
  "services",
  "resources",
  "investment",
  "investments",
  "products",
  "and",
  "sons",
]);

export function normalizeMatchName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token && !COMPANY_SUFFIXES.has(token))
    .join(" ");
}

/** Most distinctive word of a company name, used as a registry search term. */
export function distinctiveSearchTerm(value: string): string | null {
  const tokens = normalizeMatchName(value).split(" ").filter(Boolean);
  const distinctive = tokens.filter(
    (token) => token.length >= 3 && !GENERIC_BUSINESS_WORDS.has(token)
  );
  return distinctive[0] ?? tokens[0] ?? null;
}

function levenshteinSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

export function fuzzyNameSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeMatchName(left);
  const normalizedRight = normalizeMatchName(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const shorter = normalizedLeft.length <= normalizedRight.length
    ? normalizedLeft
    : normalizedRight;
  const longer = shorter === normalizedLeft ? normalizedRight : normalizedLeft;
  if (shorter.length >= 5 && longer.includes(shorter)) return 0.9;

  const leftTokens = new Set(normalizedLeft.split(" "));
  const rightTokens = new Set(normalizedRight.split(" "));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const tokenSimilarity =
    (2 * overlap) / Math.max(1, leftTokens.size + rightTokens.size);
  return Math.max(
    tokenSimilarity,
    levenshteinSimilarity(normalizedLeft, normalizedRight)
  );
}

export function fuzzyNameMatches(
  left: string,
  right: string,
  threshold = 0.78
): boolean {
  return fuzzyNameSimilarity(left, right) >= threshold;
}