import {
    ingredientsReadable,
    insufficient,
    verdict,
    type Risk,
    type Verdict,
  } from "../evidence";
  import { containsPhrase, flattenIngredients } from "./normalize";
  
  export type GmoAliasRow = { crop: string; alias: string };
  
  export type GmoInput = {
    ingredients: string[];
    /** 0-1 confidence that the ingredient text was read correctly. */
    ingredientConfidence: number;
    /** "packaged" = has an ingredient list. "produce" = loose fruit/veg/grain. */
    productType: "packaged" | "produce";
    /** Free text from the label, used for "non-GMO" / "organic" claims. */
    labelText?: string;
    /** Country of origin / manufacture if known (from label or NAFDAC record). */
    origin?: string | null;
  };
  
  /**
   * ASSUMPTIONS - these are editable policy, not facts. They express how likely
   * it is that an ingredient derived from the crop came from a GM variety in
   * the supply chains that commonly feed Nigerian packaged foods (imports from
   * the US/Americas, where GM soy, corn, canola and sugar beet are widespread).
   * Review with a food-science or NBMA source before launch and cite it in the UI.
   */
  export const CROP_WEIGHT: Record<string, number> = {
    Soy: 0.8,
    Corn: 0.8,
    Canola: 0.75,
    Cottonseed: 0.6,
    "Sugar Beet": 0.6,
    Alfalfa: 0.5,
  };
  
  /** Ingredients whose plant source is often not stated on the label. */
  const AMBIGUOUS = [
    "vegetable oil", "vegetable fat", "vegetable protein", "hydrolysed vegetable protein",
    "hydrolyzed vegetable protein", "modified starch", "starch", "lecithin", "glucose syrup",
    "glucose-fructose syrup", "dextrose", "maltodextrin", "natural flavour", "natural flavor",
    "emulsifier", "e471", "e322",
  ];
  
  const NON_GMO_CLAIMS = ["non-gmo", "non gmo", "gmo free", "gmo-free", "no gmo", "organic"];
  
  function tier(score: number): Risk {
    if (score < 0.4) return "low";
    if (score < 0.7) return "moderate";
    return "high";
  }
  
  export function scoreGmo(input: GmoInput, aliases: GmoAliasRow[]): Verdict {
    if (input.productType === "produce") {
      return insufficient("not_determinable_from_photo", [
        "A photo cannot show whether loose produce is genetically modified.",
        "We can only give ingredient-based likelihood for packaged products.",
      ]);
    }
  
    if (!ingredientsReadable(input.ingredients, input.ingredientConfidence)) {
      return insufficient(
        "ingredients_unreadable",
        [
          "We could not read the ingredient list clearly enough to assess it.",
          "Retake the photo of the ingredients panel, or submit it for admin review.",
        ],
        input.ingredientConfidence
      );
    }
  
    const flat = flattenIngredients(input.ingredients);
    const matchedCrops = new Map<string, string[]>(); // crop -> matched aliases
    for (const item of flat) {
      // Longest alias first (aliases are pre-sorted), one crop hit per item.
      for (const row of aliases) {
        if (containsPhrase(item, row.alias)) {
          const list = matchedCrops.get(row.crop) ?? [];
          if (!list.includes(row.alias)) list.push(row.alias);
          matchedCrops.set(row.crop, list);
          break;
        }
      }
    }
  
    const ambiguousFound = flat.filter((item) =>
      AMBIGUOUS.some((a) => containsPhrase(item, a)) &&
      // Ignore ones we already resolved to a crop ("soy lecithin").
      ![...matchedCrops.values()].flat().some((alias) => containsPhrase(item, alias))
    );
    const claimsNonGmo = NON_GMO_CLAIMS.some((c) =>
      (input.labelText ?? "").toLowerCase().includes(c)
    );
  
    if (matchedCrops.size === 0) {
      if (ambiguousFound.length > 0) {
        return verdict({
          evidence: "partial",
          confidence: input.ingredientConfidence,
          risk: null,
          state: "source_unclear",
          reasons: [
            `Some ingredients do not say which plant they come from: ${[...new Set(ambiguousFound)].slice(0, 4).join(", ")}.`,
            "We cannot rate the likelihood without knowing the source. You can submit this for admin review.",
          ],
        });
      }
      return verdict({
        evidence: "sufficient",
        confidence: input.ingredientConfidence,
        risk: "low",
        state: "no_tracked_ingredient",
        reasons: [
          "None of the ingredients on our GMO reference list were found in the readable label.",
          "This only reflects the ingredient list. It does not prove the product has no GM-derived content.",
        ],
      });
    }
  
    let score = Math.max(...[...matchedCrops.keys()].map((c) => CROP_WEIGHT[c] ?? 0.5));
    score += Math.min(0.1, (matchedCrops.size - 1) * 0.05);
    const reasons: string[] = [];
    for (const [crop, matched] of matchedCrops) {
      reasons.push(`${crop}-derived ingredient found (${matched.slice(0, 3).join(", ")}).`);
    }
    if (claimsNonGmo) {
      score *= 0.5;
      reasons.push("The label makes a non-GMO/organic claim. We treat this as lowering the likelihood, not as proof.");
    }
    if (ambiguousFound.length > 0) {
      reasons.push("Some other ingredients do not state their plant source, so the true likelihood could be higher.");
    }
    reasons.push(
      "Ingredient-based likelihood only. Highly refined ingredients (oils, syrups, lecithin) usually cannot be tested for GM origin."
    );
  
    return verdict({
      evidence: ambiguousFound.length > 0 ? "partial" : "sufficient",
      confidence: input.ingredientConfidence,
      risk: tier(score),
      state: "likelihood_from_ingredients",
      reasons,
    });
  }
  