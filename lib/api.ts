/**
 * API layer — DATA-FETCHING POINTS FOR THE BACKEND.
 *
 * Every function below is a clearly marked contract the frontend expects
 * from the backend once the API is live. Until then, these return safe
 * placeholder data so the demo flow works end to end.
 *
 * TODO(backend): point BASE_URL at the deployed API and replace the
 * placeholder bodies with real fetch() calls. Do not change the function
 * signatures — the frontend is built against them.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type Verdict = "safe" | "caution" | "avoid";

export type ScanResult = {
  id: string;
  name: string;
  category: "product" | "plant";
  verdict: Verdict;
  ingredients: { name: string; risk: "none" | "low" | "medium" | "high" }[];
  certifications: string[];
  flags: string[];
  ratings: { label: string; value: number }[];
  alternatives: string[];
  reviewed: boolean;
};

export type UserPreferences = {
  allergies: string[];
  sensitivities: string[];
  dietary: string[];
};

/** Fetch the current user's personalization profile. */
export async function fetchPreferences(): Promise<UserPreferences> {
  // TODO(backend): GET `${BASE_URL}/me/preferences`
  return {
    allergies: ["Soy"],
    sensitivities: [],
    dietary: ["Vegetarian"],
  };
}

/**
 * Submit scanned media (product label / plant photo) for analysis.
 * Returns the full result payload.
 */
export async function submitScan(
  _image: Blob,
  _kind: "product" | "plant"
): Promise<ScanResult> {
  // TODO(backend): POST `${BASE_URL}/scans` with the image + kind,
  // then stream processing state via the returned scan id.
  return placeholderResult;
}

/** Fetch one saved scan by id. */
export async function fetchScan(_id: string): Promise<ScanResult> {
  // TODO(backend): GET `${BASE_URL}/scans/${_id}`
  return placeholderResult;
}

/** List recent scans for the dashboard / history. */
export async function fetchScanHistory(_limit = 10): Promise<ScanResult[]> {
  // TODO(backend): GET `${BASE_URL}/scans?limit=${_limit}`
  return [placeholderResult];
}

/** Save a scan to the user's history. */
export async function saveScan(_result: ScanResult): Promise<void> {
  // TODO(backend): POST `${BASE_URL}/scans/${_result.id}/save`
  return;
}

/** Submit a rating (and optional comment) for a scan result. */
export async function submitReview(
  _scanId: string,
  _rating: number,
  _comment: string
): Promise<void> {
  // TODO(backend): POST `${BASE_URL}/scans/${_scanId}/review`
  return;
}

export type SignupPayload = {
  email: string;
  username: string;
  password: string;
};

/** Create a new Tracee account. Returns the created user. */
export async function createAccount(
  _payload: SignupPayload
): Promise<{ id: string; email: string }> {
  // TODO(backend): POST `${API_BASE_URL}/auth/signup`
  return { id: "demo-user", email: _payload.email };
}

/** Sign in with Google or Apple OAuth. */
export async function signInWithProvider(
  _provider: "google" | "apple"
): Promise<void> {
  // TODO(backend): redirect to `${API_BASE_URL}/auth/${_provider}`
  return;
}

export type LoginPayload = {
  email: string;
  password: string;
};

/** Log an existing user in. Returns the logged-in user. */
export async function login(
  _payload: LoginPayload
): Promise<{ id: string; email: string }> {
  // TODO(backend): POST `${API_BASE_URL}/auth/login`
  return { id: "demo-user", email: _payload.email };
}

export type PreferenceSelection = {
  allergies: string[];
  dietary: string[];
};

/** Placeholder username shown on the dashboard until auth is wired up. */
export const DEMO_USERNAME = "Amber";

/** Save the user's personalization preferences. */
export async function savePreferences(
  selection: PreferenceSelection
): Promise<void> {
  const response = await fetch("/api/me/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });

  if (!response.ok) {
    throw new Error("Failed to save preferences.");
  }
}

export type RiskLevel = "high" | "medium" | "low";

/**
 * An admin clearance record attached to a scan. A scan that could not be
 * assessed confidently, or that a person explicitly sent for review, carries
 * one of these so it appears in the admin review queue.
 */
export type ClearanceInfo = {
  id: string;
  status: string; // pending | cleared | rejected | needs_info
  reason: string; // insufficient_evidence | no_catalog_match | user_request
};

export type ProductAnalysisResult = {
  id: string;
  productName: string;
  ingredientConfidence: number;
  extractedText: { inferred: string };
  gmoLikelihood: ProductVerdict;
  fluorideLikelihood: ProductVerdict;
  allergens: {
    hits: {
      allergen: string;
      label: string;
      matchedTerm: string;
      ingredient: string;
      tier: "contains" | "may_contain";
    }[];
    matches: {
      mustAvoid: ProductAnalysisResult["allergens"]["hits"];
      caution: ProductAnalysisResult["allergens"]["hits"];
      otherPresent: ProductAnalysisResult["allergens"]["hits"];
    };
    savedAllergies: string[];
  };
  dietaryAssessments: {
    preference: string;
    status: "possible_conflict" | "no_obvious_conflict" | "unclear";
    explanation: string;
  }[];
  savedDietaryPreferences: string[];
  alerts: ProductAlert[];
  ingredients: {
    name: string;
    explanation: string;
    role: string;
  }[];
  analysisWarnings: string[];
  imageUrl: string;
  clearance: ClearanceInfo | null;
};

export type ProductVerdict = {
  evidence: "sufficient" | "partial" | "insufficient";
  confidence: number;
  risk: "high" | "moderate" | "low" | null;
  state: string;
  reasons: string[];
};

/**
 * A safety-relevant match between a product and the signed-in user's saved
 * preferences. Rendered prominently so a conflict is never missed.
 */
export type ProductAlert = {
  kind: "allergen" | "dietary";
  severity: "high" | "medium";
  title: string;
  detail: string;
};

/** Fetch a completed product scan result by id. */
export async function fetchProductAnalysis(id = "demo"): Promise<ProductAnalysisResult> {
  if (id === "demo") return placeholderProductAnalysis;
  const res = await fetch(`${API_BASE_URL}/scans/${id}/result`);
  if (!res.ok) throw new Error("Failed to load the product report.");
  return res.json();
}

const placeholderProductAnalysis: ProductAnalysisResult = {
  id: "scan-product-demo",
  productName: "Golden Harvest Corn Flakes",
  ingredientConfidence: 0.9,
  extractedText: {
    inferred: "corn, sugar, vegetable oil, soy lecithin, sea salt",
  },
  gmoLikelihood: {
    evidence: "partial",
    confidence: 0.9,
    risk: "high",
    state: "likelihood_from_ingredients",
    reasons: [
      "Corn- and soy-derived ingredients are listed. This is an ingredient-based likelihood, not proof of GM content.",
    ],
  },
  fluorideLikelihood: {
    evidence: "partial",
    confidence: 0.9,
    risk: null,
    state: "no_fluoride_term_found",
    reasons: [
      "No fluoride term was found in the readable text. This does not prove the product is fluoride-free.",
    ],
  },
  allergens: {
    hits: [
      {
        allergen: "soy",
        label: "Soy",
        matchedTerm: "soy lecithin",
        ingredient: "soy lecithin",
        tier: "contains",
      },
    ],
    matches: {
      mustAvoid: [],
      caution: [],
      otherPresent: [],
    },
    savedAllergies: [],
  },
  dietaryAssessments: [],
  savedDietaryPreferences: [],
  alerts: [],
  ingredients: [
    {
      name: "corn",
      explanation: "A grain made from maize; it is the main cereal ingredient here.",
      role: "Main ingredient",
    },
    {
      name: "sugar",
      explanation: "A sweetener; the label does not say whether it comes from cane or beet.",
      role: "Sweetener",
    },
    {
      name: "vegetable oil",
      explanation: "Oil from plants; the label does not identify which plant.",
      role: "Texture and cooking",
    },
    {
      name: "soy lecithin",
      explanation: "A soy-derived ingredient that helps keep ingredients mixed.",
      role: "Emulsifier",
    },
    {
      name: "sea salt",
      explanation: "Salt collected from seawater.",
      role: "Seasoning",
    },
  ],
  analysisWarnings: [],
  imageUrl: "",
  clearance: null,
};

/** One entry in the user's saved scan history. */
export type ScanHistoryItem = {
  id: string;
  productName: string;
  manufacturer: string;
  nafdacRegNo: string;
  scanDate: string;
  status: "analyzed" | "processing" | "needs-review" | "failed" | "saved";
  gmoRisk: RiskLevel | null;
  fluorideLikelihood: RiskLevel | null;
  imageUrl: string;
};

/** A page of scan history, with the total count for pagination. */
export type ScanHistoryPage = {
  items: ScanHistoryItem[];
  total: number;
};

export type NotificationSettings = {
  gmoWarnings: boolean;
  fluorideWarnings: boolean;
  allergenAlerts: boolean;
  dietaryAlerts: boolean;
};

/** The signed-in user's account profile. */
export type UserProfile = {
  name: string;
  email: string;
  premiumMember: boolean;
  allergies: string[];
  dietary: string[];
  notifications: NotificationSettings;
};

/** Fetch the current user's account profile. */
export async function fetchProfile(): Promise<UserProfile> {
  // TODO(backend): GET `${API_BASE_URL}/me/profile`
  return placeholderProfile;
}

const placeholderProfile: UserProfile = {
  name: "Alex Prokhorov",
  email: "alex.p@tracee.io",
  premiumMember: true,
  allergies: ["Soy", "Nuts", "Gluten"],
  dietary: ["Vegetarian", "Halal"],
  notifications: {
    gmoWarnings: true,
    fluorideWarnings: true,
    allergenAlerts: true,
    dietaryAlerts: true,
  },
};

const placeholderResult: ScanResult = {
  id: "demo-1",
  name: "Sample Organic Granola Bar",
  category: "product",
  verdict: "caution",
  ingredients: [
    { name: "Whole grain oats", risk: "none" },
    { name: "Honey", risk: "low" },
    { name: "Soy lecithin", risk: "medium" },
  ],
  certifications: ["Organic", "Non-GMO"],
  flags: ["Contains soy — matches a sensitivity in your profile."],
  ratings: [
    { label: "Transparency", value: 4 },
    { label: "Safety", value: 3 },
    { label: "Personal fit", value: 2 },
  ],
  alternatives: ["Soy-free granola sampler", "Homemade granola kit"],
  reviewed: false,
};
