import {
    ingredientsReadable,
    insufficient,
    verdict,
    type Risk,
    type Verdict,
  } from "../evidence";
  import { containsPhrase, flattenIngredients } from "./normalize";
  
  export type FluorideInput = {
    ingredients: string[];
    ingredientConfidence: number;
    /** Everything legible on the pack, to find "1450 ppm F" style statements. */
    labelText?: string;
    productType: "toothpaste" | "mouthwash" | "water" | "food" | "other";
    /** Who the user is buying for. Children under 6 swallow more paste. */
    ageBand?: "under6" | "6plus";
  };
  
  const FLUORIDE_TERMS = [
    "sodium fluoride", "sodium monofluorophosphate", "monofluorophosphate", "mfp",
    "stannous fluoride", "tin fluoride", "amine fluoride", "olaflur", "dectaflur",
    "calcium fluoride", "potassium fluoride", "fluoride", "fluorure", "fluor",
  ];
  const FREE_CLAIMS = ["fluoride free", "fluoride-free", "no fluoride", "without fluoride", "0% fluoride"];
  
  /**
   * PLACEHOLDER THRESHOLDS - have a dental professional or a source such as WHO/
   * national dental guidance confirm these before launch, and cite it in the UI.
   * Fluoride toothpaste at normal strength is widely considered safe and effective;
   * the practical concern is concentration and young children swallowing paste.
   */
  function gradePpm(ppm: number, band: "under6" | "6plus"): { risk: Risk; note: string } {
    if (band === "under6") {
      if (ppm <= 1000) return { risk: "low", note: "Within the strength commonly advised for young children (use a pea-sized smear)." };
      if (ppm <= 1500) return { risk: "moderate", note: "Higher than the strength commonly advised for children under 6." };
      return { risk: "high", note: "Well above the strength commonly advised for children under 6." };
    }
    if (ppm <= 1500) return { risk: "low", note: "Within the usual range for adult and older-child toothpaste." };
    if (ppm <= 5000) return { risk: "moderate", note: "Above usual over-the-counter strength. Such pastes are normally prescribed." };
    return { risk: "high", note: "Far above usual over-the-counter strength." };
  }
  
  export function assessFluoride(input: FluorideInput): Verdict {
    if (!ingredientsReadable(input.ingredients, input.ingredientConfidence)) {
      return insufficient(
        "ingredients_unreadable",
        [
          "We could not read the ingredient list clearly enough to check for fluoride.",
          "Not finding a fluoride term in unreadable text tells us nothing.",
        ],
        input.ingredientConfidence
      );
    }
  
    const flat = flattenIngredients(input.ingredients);
    const text = `${flat.join(" | ")} ${input.labelText ?? ""}`.toLowerCase();
    const found = FLUORIDE_TERMS.filter((t) => containsPhrase(text, t));
    const claimsFree = FREE_CLAIMS.some((c) => text.includes(c));
  
    if (found.length === 0) {
      return verdict({
        evidence: "partial",
        confidence: input.ingredientConfidence,
        risk: null,
        state: claimsFree ? "claims_fluoride_free_unverified" : "no_fluoride_term_found",
        reasons: [
          claimsFree
            ? "The label says it is fluoride-free. We have not verified that claim."
            : "No fluoride term was found in the text we could read.",
          "This is not proof the product is fluoride-free. Some labels omit it or list it under another name.",
        ],
      });
    }
  
    const ppmMatch = text.match(/(\d{3,5})\s*ppm/);
    const ppm = ppmMatch ? Number(ppmMatch[1]) : null;
    const reasons = [`Fluoride-containing ingredient found: ${[...new Set(found)].slice(0, 3).join(", ")}.`];
  
    if (input.productType !== "toothpaste") {
      return verdict({
        evidence: "partial",
        confidence: input.ingredientConfidence,
        risk: null,
        state: "detected_not_graded",
        reasons: [...reasons, "We only grade fluoride strength for toothpaste."],
      });
    }
    if (ppm === null) {
      return verdict({
        evidence: "partial",
        confidence: input.ingredientConfidence,
        risk: null,
        state: "detected_strength_unknown",
        reasons: [...reasons, "The label does not state the fluoride strength (ppm), so we cannot rate it."],
      });
    }
  
    const graded = gradePpm(ppm, input.ageBand ?? "6plus");
    return verdict({
      evidence: "sufficient",
      confidence: input.ingredientConfidence,
      risk: graded.risk,
      state: "graded_by_strength",
      reasons: [...reasons, `Stated strength: ${ppm} ppm. ${graded.note}`],
    });
  }
  