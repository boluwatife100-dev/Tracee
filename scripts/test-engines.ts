import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scoreGmo } from "../lib/engines/gmo";
import { assessFluoride } from "../lib/engines/fluoride";
import { detectAllergens, matchUserAllergens } from "../lib/engines/allergens";
import { normalizeIngredients } from "../lib/engines/normalize";
import { loadGmoReference } from "../lib/engines/gmo-reference";
import { isValidGtin } from "../lib/gtin";

const ref = loadGmoReference();
const ing = (s: string) => normalizeIngredients(s);

// GMO: unreadable must never produce a rating
let v = scoreGmo({ ingredients: [], ingredientConfidence: 0.2, productType: "packaged" }, ref);
assert.equal(v.evidence, "insufficient"); assert.equal(v.risk, null);
v = scoreGmo({ ingredients: ing("water, soy lecithin, corn syrup"), ingredientConfidence: 0.3, productType: "packaged" }, ref);
assert.equal(v.risk, null, "low confidence must not rate even if terms matched");
v = scoreGmo({ ingredients: ing("tomatoes"), ingredientConfidence: 0.9, productType: "produce" }, ref);
assert.equal(v.state, "not_determinable_from_photo");

// GMO: readable cases
v = scoreGmo({ ingredients: ing("Water, High Fructose Corn Syrup, Soy Lecithin, Salt"), ingredientConfidence: 0.9, productType: "packaged" }, ref);
assert.equal(v.risk, "high");
v = scoreGmo({ ingredients: ing("Water, sugar, salt, black peppercorn"), ingredientConfidence: 0.9, productType: "packaged" }, ref);
assert.equal(v.risk, "low"); assert.match(v.reasons.join(" "), /does not prove/);
v = scoreGmo({ ingredients: ing("Water, vegetable oil, modified starch"), ingredientConfidence: 0.9, productType: "packaged" }, ref);
assert.equal(v.risk, null); assert.equal(v.evidence, "partial");
v = scoreGmo({ ingredients: ing("Water, soy flour, salt"), ingredientConfidence: 0.9, productType: "packaged", labelText: "Organic" }, ref);
assert.equal(v.risk, "moderate");

// Fluoride
v = assessFluoride({ ingredients: [], ingredientConfidence: 0.1, productType: "toothpaste" });
assert.equal(v.risk, null); assert.equal(v.evidence, "insufficient");
v = assessFluoride({ ingredients: ing("calcium carbonate, water, glycerin, sodium lauryl sulfate, flavour"), ingredientConfidence: 0.9, productType: "toothpaste" });
assert.equal(v.risk, null); assert.equal(v.state, "no_fluoride_term_found");
v = assessFluoride({ ingredients: ing("water, sorbitol, sodium monofluorophosphate, silica"), ingredientConfidence: 0.9, productType: "toothpaste", labelText: "1450 ppm F" });
assert.equal(v.risk, "low");
v = assessFluoride({ ingredients: ing("water, sorbitol, sodium fluoride, silica"), ingredientConfidence: 0.9, productType: "toothpaste", labelText: "1450ppm", ageBand: "under6" });
assert.equal(v.risk, "moderate");
v = assessFluoride({ ingredients: ing("water, sorbitol, sodium fluoride, silica"), ingredientConfidence: 0.9, productType: "toothpaste" });
assert.equal(v.state, "detected_strength_unknown"); assert.equal(v.risk, null);

// Allergens
const hits = detectAllergens(ing("wheat flour, sodium caseinate, albumen, peppercorn"), "may contain peanuts");
const keys = hits.map((h) => `${h.allergen}:${h.tier}`).sort();
assert.deepEqual(keys, ["egg:contains", "milk:contains", "peanut:may_contain", "wheat_gluten:contains"]);
const m = matchUserAllergens(hits, ["milk", "peanut"]);
assert.equal(m.mustAvoid.length, 1); assert.equal(m.caution.length, 1);

// GTIN
assert.equal(isValidGtin("4006381333931"), true);
assert.equal(isValidGtin("4006381333932"), false);
console.log("unit checks passed");

// Optional: replay a JSON export of working_dataset.csv ([{ing, flag}]) against its gmo_flag.
// Usage: npx tsx scripts/test-engines.ts replay.json
if (!process.argv[2]) process.exit(0);
const rows = JSON.parse(readFileSync(process.argv[2], "utf8")) as { ing: string; flag: boolean }[];
let agree = 0, engineOnly = 0, flagOnly = 0, unreadable = 0;
const tiers: Record<string, number> = {};
const samples: string[] = [];
for (const r of rows) {
  const items = ing(r.ing);
  const out = scoreGmo({ ingredients: items, ingredientConfidence: 0.9, productType: "packaged" }, ref);
  if (out.evidence === "insufficient") { unreadable++; continue; }
  const matched = out.state === "likelihood_from_ingredients";
  tiers[out.risk ?? "null"] = (tiers[out.risk ?? "null"] ?? 0) + 1;
  if (matched === r.flag) agree++;
  else if (matched) { engineOnly++; if (samples.length < 3) samples.push("engine-only: " + r.ing.slice(0, 120)); }
  else { flagOnly++; if (samples.length < 6) samples.push("flag-only: " + r.ing.slice(0, 120)); }
}
console.log({ rows: rows.length, agree, engineOnly, flagOnly, unreadable, tiers });
console.log(samples.join("\n"));
