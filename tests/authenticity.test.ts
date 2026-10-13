import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractRegistrationNumberFromOcr,
  fuzzyNameMatches,
  normalizeMatchName,
  normalizeRegistrationNumber,
} from "../lib/authenticity/normalization";
import {
  scoreAuthenticity,
  type AuthenticityExtraction,
  type ScoringRecord,
} from "../lib/authenticity/scoring";

const confidentExtraction = (): AuthenticityExtraction => ({
  nafdacRegNumber: "A8-102316L",
  productName: "Ozig eo Foods Soya Milk",
  brand: "Ozig eo",
  manufacturerImporter: "George Soft Stir Foods Ltd",
  batchNumber: "B24017",
  mfgDate: "2024-02-01",
  expiryDate: "2027-02-01",
  category: "food",
  confidence: {
    nafdacRegNumber: 0.98,
    productName: 0.94,
    brand: 0.9,
    manufacturerImporter: 0.93,
    batchNumber: 0.8,
    mfgDate: 0.8,
    expiryDate: 0.9,
    category: 0.85,
  },
  unreadableFields: [],
});

const registeredRecord: ScoringRecord = {
  registrationNumber: "A8-102316L",
  productName: "Ozig eo Foods Soya Milk",
  brand: null,
  manufacturer: "George Soft Stir Foods Limited",
  category: "Food",
};

test("normalizes NAFDAC registration numbers and common OCR substitutions", () => {
  assert.equal(normalizeRegistrationNumber(" a8 - 1O2316l "), "A8-102316L");
  assert.equal(normalizeRegistrationNumber("A8-I02316L"), "A8-102316L");
  assert.equal(normalizeRegistrationNumber("not a registration"), null);
  assert.equal(
    extractRegistrationNumberFromOcr("NAFDAC Reg. No: A8-I02316L"),
    "A8-102316L"
  );
});

test("fuzzy matching ignores punctuation and company suffixes", () => {
  assert.equal(normalizeMatchName("Acme Foods Ltd."), "acme foods");
  assert.equal(fuzzyNameMatches("Acme Foods, Ltd.", "ACME Foods Limited"), true);
  assert.equal(fuzzyNameMatches("Acme Foods", "Unrelated Cosmetics"), false);
});

test("returns VERIFIED_REGISTRATION when the registry details match", () => {
  const result = scoreAuthenticity({
    extraction: confidentExtraction(),
    lookup: { found: true, record: registeredRecord, available: true },
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  assert.equal(result.state, "VERIFIED_REGISTRATION");
  assert.equal(result.lookupAvailable, true);
  assert.match(result.reasons.join(" "), /match the registry record/i);
});

test("returns MISMATCH when the registered product name conflicts", () => {
  const result = scoreAuthenticity({
    extraction: confidentExtraction(),
    lookup: {
      found: true,
      record: { ...registeredRecord, productName: "Different Product" },
      available: true,
    },
  });
  assert.equal(result.state, "MISMATCH");
  assert.match(result.reasons.join(" "), /registered product name differs/i);
});

test("returns NOT_FOUND when a readable number has no registry record", () => {
  const result = scoreAuthenticity({
    extraction: confidentExtraction(),
    lookup: { found: false, record: null, available: true },
  });
  assert.equal(result.state, "NOT_FOUND");
  assert.match(result.reasons.join(" "), /No matching registration number/i);
});

test("scores a manually entered registration number without altering it", () => {
  const extraction = confidentExtraction();
  extraction.nafdacRegNumber = "A8-1O2316L";
  extraction.confidence.nafdacRegNumber = 1;
  const result = scoreAuthenticity({
    extraction,
    registrationNumberOverride: "A8-1O2316L",
    lookup: {
      found: true,
      record: { ...registeredRecord, registrationNumber: "A8-1O2316L" },
      available: true,
    },
  });
  assert.equal(result.state, "VERIFIED_REGISTRATION");
});

test("returns INSUFFICIENT_EVIDENCE for an unreadable label or failed lookup", () => {
  const unreadable = confidentExtraction();
  unreadable.nafdacRegNumber = null;
  unreadable.confidence.nafdacRegNumber = 0;
  unreadable.unreadableFields.push("nafdacRegNumber");
  const unreadableResult = scoreAuthenticity({
    extraction: unreadable,
    lookup: { found: false, record: null, available: true },
  });
  assert.equal(unreadableResult.state, "INSUFFICIENT_EVIDENCE");

  const lookupFailure = scoreAuthenticity({
    extraction: confidentExtraction(),
    lookup: { found: false, record: null, available: false },
  });
  assert.equal(lookupFailure.state, "INSUFFICIENT_EVIDENCE");
  assert.equal(lookupFailure.lookupAvailable, false);
  assert.match(lookupFailure.reasons.join(" "), /could not be reached/i);
});

test("flags a missing batch number and expired or implausible dates", () => {
  const extraction = confidentExtraction();
  extraction.batchNumber = null;
  extraction.mfgDate = "2027-01-01";
  extraction.expiryDate = "2026-01-01";
  const result = scoreAuthenticity({
    extraction,
    lookup: { found: true, record: registeredRecord, available: true },
    now: new Date("2026-06-01T00:00:00.000Z"),
  });
  assert.match(result.reasons.join(" "), /No readable batch number/i);
  assert.match(result.reasons.join(" "), /manufacture date appears to be in the future/i);
  assert.match(result.reasons.join(" "), /expiry date is earlier than the manufacture date/i);
});
