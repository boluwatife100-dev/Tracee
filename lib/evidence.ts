/**
 * Core rule of the app: evidence (did we have enough data?) is separate from
 * risk (what does the data say?). A risk value may only exist when evidence is
 * not "insufficient". Never let a missing or unreadable label turn into "low".
 */

export type Evidence = "sufficient" | "partial" | "insufficient";
export type Risk = "low" | "moderate" | "high";

export type Verdict = {
  evidence: Evidence;
  /** 0-1: how reliably we read the inputs (not how risky the product is). */
  confidence: number;
  /** null whenever we cannot or should not give a rating. */
  risk: Risk | null;
  /** Short machine-readable state for the UI. */
  state: string;
  /** Plain-language reasons, shown to the user. */
  reasons: string[];
  rulesetVersion: string;
};

export const RULESET_VERSION = "2026-10-06.1";

/** Minimum confidence in the ingredient text before any rating is allowed. */
export const MIN_INGREDIENT_CONFIDENCE = 0.6;

export function insufficient(state: string, reasons: string[], confidence = 0): Verdict {
  return {
    evidence: "insufficient",
    confidence,
    risk: null,
    state,
    reasons,
    rulesetVersion: RULESET_VERSION,
  };
}

/** Builds a verdict and enforces the invariant: insufficient evidence => no risk. */
export function verdict(v: Omit<Verdict, "rulesetVersion">): Verdict {
  return {
    ...v,
    risk: v.evidence === "insufficient" ? null : v.risk,
    rulesetVersion: RULESET_VERSION,
  };
}

export function ingredientsReadable(ingredients: string[], confidence: number): boolean {
  // One ingredient is legitimate ("pork", "raisins"), so do not require two.
  const chars = ingredients.join("").length;
  return ingredients.length >= 1 && chars >= 3 && confidence >= MIN_INGREDIENT_CONFIDENCE;
}
