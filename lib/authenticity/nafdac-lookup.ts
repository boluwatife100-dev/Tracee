import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "../prisma";
import { distinctiveSearchTerm, fuzzyNameSimilarity } from "./normalization";

const FOOD_DATABASE_URL = "https://nafdac.gov.ng/food-products-database/";
const GREENBOOK_URL = "https://greenbook.nafdac.gov.ng/";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;
const MAX_FOOD_CHUNKS = 80;
const COMPANY_MATCH_THRESHOLD = 0.85;
const MAX_LISTED_PRODUCTS = 10;

export type RegistrySource = "food_db" | "greenbook";

/**
 * How the registry record (if any) was matched to the pack:
 * - registration:            printed NAFDAC number found in the registry
 * - manufacturer_and_product: number not found/unreadable, but the printed company AND a
 *                             compatible product name are registered together
 * - manufacturer:            company is registered, but this product was not found under it
 * - none:                    nothing trustworthy matched
 * A product-name-only match is deliberately NOT a basis: generic names ("Bread") match
 * other companies' products.
 */
export type MatchBasis =
  | "registration"
  | "manufacturer_and_product"
  | "manufacturer"
  | "none";

export type NafdacRecord = {
  registrationNumber: string;
  productName: string;
  brand: string | null;
  manufacturer: string | null;
  category: string | null;
  raw: Record<string, unknown>;
};

export type NafdacLookupResult = {
  /** true only when the printed registration number was found */
  found: boolean;
  /** set for "registration" and "manufacturer_and_product" matches only */
  record: NafdacRecord | null;
  matchBasis: MatchBasis;
  /** the printed company name matched a registered company */
  manufacturerFound: boolean;
  /** other products registered under the matched company (for context, max 10) */
  manufacturerProducts: string[];
  source: RegistrySource | null;
  fetchedAt: Date | null;
  available: boolean | null;
  officialUrl: string;
};

type CachedResponse = {
  found: boolean;
  records: Record<string, unknown>[];
  fetchedAt: Date;
};

let lastOutboundRequestAt = 0;
let outboundQueue = Promise.resolve();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleOutboundRequest<T>(request: () => Promise<T>): Promise<T> {
  const previous = outboundQueue;
  let release!: () => void;
  outboundQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const delay = Math.max(0, 1_000 - (Date.now() - lastOutboundRequestAt));
    if (delay) await wait(delay);
    lastOutboundRequestAt = Date.now();
    return await request();
  } finally {
    release();
  }
}

async function fetchWithRetry(
  url: string,
  referer: string,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  return scheduleOutboundRequest(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json, text/html;q=0.9",
            "User-Agent": "TraceeAuthenticityChecker/1.0",
            Referer: referer,
            ...extraHeaders,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: "no-store",
        });
        if (response.ok) return response;
        if (response.status < 500 && response.status !== 429) {
          throw new Error(`NAFDAC registry returned HTTP ${response.status}.`);
        }
        lastError = new Error(`NAFDAC registry returned HTTP ${response.status}.`);
      } catch (error) {
        lastError = error;
      }
      if (attempt < MAX_RETRIES) await wait(250 * 2 ** attempt);
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("NAFDAC registry request failed.");
  });
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nestedString(
  object: Record<string, unknown>,
  parentKey: string,
  childKey: string
): string | null {
  const parent = asObject(object[parentKey]);
  return typeof parent?.[childKey] === "string"
    ? parent[childKey].trim()
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeFoodRow(value: unknown): NafdacRecord | null {
  const row = asObject(value);
  if (!row) return null;
  const registrationNumber = text(row.nafdacnumber);
  const productName = text(row.productname);
  if (!registrationNumber || !productName) return null;
  return {
    registrationNumber,
    productName,
    brand: null,
    manufacturer: text(row.manufacturer) ?? text(row.applicantname),
    category: text(row.category) ?? text(row.subcategory),
    raw: row,
  };
}

function normalizeGreenbookRow(value: unknown): NafdacRecord | null {
  const row = asObject(value);
  if (!row) return null;
  const registrationNumber = text(row.NAFDAC);
  const productName = text(row.product_name);
  if (!registrationNumber || !productName) return null;
  return {
    registrationNumber,
    productName,
    brand: null,
    manufacturer:
      nestedString(row, "applicant", "name") ??
      nestedString(row, "manufacturer", "name"),
    category: nestedString(row, "product_category", "name"),
    raw: row,
  };
}

function parseFoodRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error("Unexpected food registry response.");
  return value.flatMap((entry) => {
    const row = asObject(asObject(entry)?.value);
    return row ? [row] : [];
  });
}

function normalizedQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function matchesRegistration(row: NafdacRecord, registrationNumber: string): boolean {
  return normalizedQuery(row.registrationNumber) === normalizedQuery(registrationNumber);
}

/** Every company name a registry row carries (applicant and manufacturer). */
function companyNames(record: NafdacRecord): string[] {
  const raw = record.raw;
  const names = [
    record.manufacturer,
    nestedString(raw, "applicant", "name"),
    nestedString(raw, "manufacturer", "name"),
    text(raw.applicantname),
    text(raw.manufacturer),
  ];
  return [...new Set(names.filter((name): name is string => Boolean(name)))];
}

function matchesCompany(record: NafdacRecord, company: string): boolean {
  return companyNames(record).some(
    (name) => fuzzyNameSimilarity(name, company) >= COMPANY_MATCH_THRESHOLD
  );
}

/**
 * Used only on records already scoped to the same company, so a generic registered
 * name like "BREAD" is acceptable there. Never use this on unscoped registry rows.
 */
function productNamesCompatible(registered: string, printed: string): boolean {
  if (fuzzyNameSimilarity(registered, printed) >= 0.75) return true;
  const registeredTokens = registered
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
  const printedTokens = new Set(
    printed.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  );
  return (
    registeredTokens.length > 0 &&
    registeredTokens.every((token) => printedTokens.has(token))
  );
}

async function readCache(
  queryKey: string,
  source: RegistrySource
): Promise<CachedResponse | null> {
  const cached = await prisma.nafdacLookup.findUnique({ where: { queryKey } });
  if (!cached || cached.source !== source) return null;
  if (Date.now() - cached.fetchedAt.getTime() > CACHE_TTL_MS) return null;
  const records = Array.isArray(cached.records)
    ? cached.records.map(asObject).filter((row): row is Record<string, unknown> => row !== null)
    : [];
  return { found: cached.found, records, fetchedAt: cached.fetchedAt };
}

async function writeCache(
  queryKey: string,
  source: RegistrySource,
  records: Record<string, unknown>[]
): Promise<CachedResponse> {
  const fetchedAt = new Date();
  const jsonRecords = JSON.parse(JSON.stringify(records)) as Prisma.InputJsonValue;
  const cached = await prisma.nafdacLookup.upsert({
    where: { queryKey },
    create: {
      queryKey,
      source,
      found: records.length > 0,
      records: jsonRecords,
      fetchedAt,
    },
    update: {
      source,
      found: records.length > 0,
      records: jsonRecords,
      fetchedAt,
    },
  });
  return { found: cached.found, records, fetchedAt };
}

type RegistryQuery =
  | { by: "registration"; registrationNumber: string }
  | { by: "manufacturer"; manufacturer: string };

function cacheKey(source: RegistrySource, query: RegistryQuery): string {
  return query.by === "registration"
    ? `authenticity:${source}:reg:${normalizedQuery(query.registrationNumber)}`
    : `authenticity:${source}:mfr:${normalizedQuery(query.manufacturer)}`;
}

function rowMatchesQuery(record: NafdacRecord, query: RegistryQuery): boolean {
  return query.by === "registration"
    ? matchesRegistration(record, query.registrationNumber)
    : matchesCompany(record, query.manufacturer);
}

async function queryGreenbook(query: RegistryQuery): Promise<CachedResponse> {
  const queryKey = cacheKey("greenbook", query);
  const cached = await readCache(queryKey, "greenbook");
  if (cached) return cached;

  const pageResponse = await fetchWithRetry(GREENBOOK_URL, GREENBOOK_URL);
  const html = await pageResponse.text();
  const csrfToken = html.match(/<meta name="csrf-token" content="([^"]+)"/i)?.[1];
  if (!csrfToken) throw new Error("Greenbook search token was not present on the page.");
  const cookies = pageResponse.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");

  // Company searches use only the most distinctive word ("charay"), because the
  // registry may store a longer or differently-punctuated name; results are then
  // fuzzy-filtered locally.
  const companyTerm =
    query.by === "manufacturer" ? distinctiveSearchTerm(query.manufacturer) : null;
  if (query.by === "manufacturer" && !companyTerm) {
    return writeCache(queryKey, "greenbook", []);
  }

  const request = new URL(GREENBOOK_URL);
  request.searchParams.set("draw", "1");
  request.searchParams.set("start", "0");
  request.searchParams.set("length", query.by === "manufacturer" ? "50" : "25");
  request.searchParams.set("search[value]", "");
  request.searchParams.set("search[regex]", "false");

  const columns = [
    "product_name",
    "ingredient.ingredient_name",
    "product_category.name",
    "product_category_id",
    "ingredient.synonym",
    "NAFDAC",
    "form.name",
    "route.name",
    "strength",
    "applicant.name",
    "approval_date",
    "status",
  ];
  columns.forEach((column, index) => {
    request.searchParams.set(`columns[${index}][data]`, column);
    request.searchParams.set(`columns[${index}][name]`, column);
    request.searchParams.set(`columns[${index}][searchable]`, "true");
    request.searchParams.set(`columns[${index}][orderable]`, "true");
    request.searchParams.set(`columns[${index}][search][value]`, "");
    request.searchParams.set(`columns[${index}][search][regex]`, "false");
  });

  if (query.by === "registration") {
    request.searchParams.set("columns[5][search][value]", query.registrationNumber);
  } else if (companyTerm) {
    request.searchParams.set("columns[9][search][value]", companyTerm);
  }

  const response = await fetchWithRetry(request.toString(), GREENBOOK_URL, {
    "X-CSRF-TOKEN": csrfToken,
    "X-Requested-With": "XMLHttpRequest",
    ...(cookies ? { Cookie: cookies } : {}),
  });
  const data = asObject(await response.json());
  if (!Array.isArray(data?.data)) {
    throw new Error("Greenbook returned an unexpected search response.");
  }
  const records = data.data.flatMap((row) => {
    const normalized = normalizeGreenbookRow(row);
    return normalized && rowMatchesQuery(normalized, query) ? [normalized.raw] : [];
  });
  return writeCache(queryKey, "greenbook", records);
}

async function queryFoodDatabase(query: RegistryQuery): Promise<CachedResponse> {
  const queryKey = cacheKey("food_db", query);
  const cached = await readCache(queryKey, "food_db");
  if (cached) return cached;

  const pageResponse = await fetchWithRetry(FOOD_DATABASE_URL, FOOD_DATABASE_URL);
  const html = await pageResponse.text();
  const requestUrl = html.match(/data_request_url\\?"?\s*:\s*"((?:\\.|[^"])*)"/)?.[1];
  if (!requestUrl) throw new Error("Food registry table URL was not present on the page.");
  const decodedUrl = JSON.parse(`"${requestUrl}"`) as string;
  const baseUrl = new URL(decodedUrl);

  const matches: Record<string, unknown>[] = [];
  let reachedEnd = false;
  for (let chunk = 0; chunk < MAX_FOOD_CHUNKS; chunk += 1) {
    const chunkUrl = new URL(baseUrl);
    chunkUrl.searchParams.set("chunk_number", String(chunk));
    const response = await fetchWithRetry(chunkUrl.toString(), FOOD_DATABASE_URL);
    const rows = parseFoodRows(await response.json());
    if (rows.length === 0) {
      reachedEnd = true;
      break;
    }

    for (const row of rows) {
      const record = normalizeFoodRow(row);
      if (record && rowMatchesQuery(record, query)) matches.push(record.raw);
    }
    // A registration number is unique, so stop at the first hit. A company can own
    // many products spread across chunks, so keep scanning for those.
    if (query.by === "registration" && matches.length) break;
    if (rows.length < 3_000) {
      reachedEnd = true;
      break;
    }
  }
  if (!reachedEnd && matches.length === 0) {
    throw new Error("Food registry pagination did not reach its final chunk.");
  }

  return writeCache(queryKey, "food_db", matches);
}

function runQuery(source: RegistrySource, query: RegistryQuery): Promise<CachedResponse> {
  return source === "greenbook" ? queryGreenbook(query) : queryFoodDatabase(query);
}

function recordFromRaw(
  source: RegistrySource,
  value: Record<string, unknown>
): NafdacRecord | null {
  return source === "food_db" ? normalizeFoodRow(value) : normalizeGreenbookRow(value);
}

function recordsFrom(source: RegistrySource, response: CachedResponse): NafdacRecord[] {
  return response.records
    .map((row) => recordFromRaw(source, row))
    .filter((record): record is NafdacRecord => record !== null);
}

export async function lookupNafdacProduct(input: {
  registrationNumber: string | null;
  productName: string | null;
  manufacturer: string | null;
  category: string | null;
}): Promise<NafdacLookupResult> {
  const sources: RegistrySource[] =
    input.category === "food" || input.category === "beverage"
      ? ["greenbook", "food_db"]
      : ["greenbook"];
  const officialUrl = sources.includes("food_db") ? FOOD_DATABASE_URL : GREENBOOK_URL;

  const empty: NafdacLookupResult = {
    found: false,
    record: null,
    matchBasis: "none",
    manufacturerFound: false,
    manufacturerProducts: [],
    source: null,
    fetchedAt: null,
    available: null,
    officialUrl: GREENBOOK_URL,
  };
  if (!input.registrationNumber && !input.manufacturer) return empty;

  let failedCount = 0;
  let lastSuccessfulSource: RegistrySource | null = null;
  let lastSuccessfulFetchedAt: Date | null = null;

  // Pass 1: printed registration number (strongest evidence).
  if (input.registrationNumber) {
    for (const source of sources) {
      try {
        const response = await runQuery(source, {
          by: "registration",
          registrationNumber: input.registrationNumber,
        });
        lastSuccessfulSource = source;
        lastSuccessfulFetchedAt = response.fetchedAt;
        const record = recordsFrom(source, response)[0];
        if (record) {
          return {
            found: true,
            record,
            matchBasis: "registration",
            manufacturerFound: input.manufacturer
              ? matchesCompany(record, input.manufacturer)
              : false,
            manufacturerProducts: [],
            source,
            fetchedAt: response.fetchedAt,
            available: true,
            officialUrl: source === "food_db" ? FOOD_DATABASE_URL : GREENBOOK_URL,
          };
        }
      } catch (error) {
        failedCount += 1;
        console.error(`NAFDAC ${source} registration lookup failed`, error);
      }
    }
  }

  // Pass 2: printed company name as a second source of truth.
  let manufacturerFound = false;
  const manufacturerProducts: string[] = [];
  let candidate: { record: NafdacRecord; source: RegistrySource; fetchedAt: Date } | null =
    null;

  if (input.manufacturer) {
    for (const source of sources) {
      try {
        const response = await runQuery(source, {
          by: "manufacturer",
          manufacturer: input.manufacturer,
        });
        lastSuccessfulSource = source;
        lastSuccessfulFetchedAt = response.fetchedAt;
        const records = recordsFrom(source, response);
        if (records.length === 0) continue;
        manufacturerFound = true;
        for (const record of records) {
          if (
            manufacturerProducts.length < MAX_LISTED_PRODUCTS &&
            !manufacturerProducts.includes(record.productName)
          ) {
            manufacturerProducts.push(record.productName);
          }
        }
        if (!candidate && input.productName) {
          const printedName = input.productName;
          const compatible = records.find((record) =>
            productNamesCompatible(record.productName, printedName)
          );
          if (compatible) {
            candidate = { record: compatible, source, fetchedAt: response.fetchedAt };
          }
        }
      } catch (error) {
        failedCount += 1;
        console.error(`NAFDAC ${source} manufacturer lookup failed`, error);
      }
    }
  }

  const matchBasis: MatchBasis = candidate
    ? "manufacturer_and_product"
    : manufacturerFound
      ? "manufacturer"
      : "none";

  return {
    found: false,
    record: candidate?.record ?? null,
    matchBasis,
    manufacturerFound,
    manufacturerProducts,
    source: candidate?.source ?? lastSuccessfulSource,
    fetchedAt: candidate?.fetchedAt ?? lastSuccessfulFetchedAt,
    available: failedCount === 0,
    officialUrl,
  };
}