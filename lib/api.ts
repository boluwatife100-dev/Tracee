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
  _selection: PreferenceSelection
): Promise<void> {
  // TODO(backend): PUT `${API_BASE_URL}/me/preferences`
  return;
}

export type TreatmentAction = "prune" | "airflow" | "spray" | "water";

export type TreatmentStep = {
  title: string;
  description: string;
  action: TreatmentAction;
};

export type PlantScanResult = {
  id: string;
  diagnosis: string;
  plantName: string;
  summary: string;
  symptoms: { name: string; detail: string }[];
  treatment: TreatmentStep[];
  scanDate: string;
  assignedLocation: string;
  imageUrl: string;
};

/** Fetch a completed plant scan result by id. */
export async function fetchPlantScan(_id = "demo"): Promise<PlantScanResult> {
  // TODO(backend): GET `${API_BASE_URL}/scans/${_id}`
  return placeholderPlantScan;
}

const placeholderPlantScan: PlantScanResult = {
  id: "scan-demo",
  diagnosis: "Powdery Mildew Detected",
  plantName: "Monstera Deliciosa",
  summary:
    "Powdery mildew is a common fungal disease that shows up as a chalky white coating on leaves and stems. It thrives in warm, humid rooms with poor airflow, and spreads quickly from leaf to leaf when left untreated.",
  symptoms: [
    {
      name: "White powdery patches",
      detail: "Fuzzy white coating on the upper leaf surfaces",
    },
    {
      name: "Yellowing leaves",
      detail: "Leaves fade and lose their deep green color",
    },
    {
      name: "Curled or distorted growth",
      detail: "New shoots twist as the fungus spreads",
    },
    {
      name: "Stunted growth",
      detail: "The plant slows or stops producing new leaves",
    },
  ],
  treatment: [
    {
      title: "Prune Infected Leaves",
      description:
        "Trim affected foliage with sterilized shears to slow the spread.",
      action: "prune",
    },
    {
      title: "Improve Airflow",
      description:
        "Space plants apart and ventilate the room so leaves dry faster.",
      action: "airflow",
    },
    {
      title: "Apply Treatment Spray",
      description:
        "Use a fungicide or baking soda mix, following the label directions.",
      action: "spray",
    },
    {
      title: "Adjust Watering",
      description:
        "Water at the base of the plant and avoid wetting the leaves.",
      action: "water",
    },
  ],
  scanDate: "Sep 21, 2026",
  assignedLocation: "Indoor — Living Room",
  imageUrl: "",
};

export type RiskLevel = "high" | "medium" | "low";

export type ProductAnalysisResult = {
  id: string;
  productName: string;
  manufacturer: string;
  nafdacRegNo: string;
  verified: boolean;
  gmoLikelihood: {
    level: RiskLevel;
    description: string;
  };
  ingredients: { name: string; note?: string }[];
  imageUrl: string;
};

/** Fetch a completed product scan result by id. */
export async function fetchProductAnalysis(
  _id = "demo"
): Promise<ProductAnalysisResult> {
  // TODO(backend): GET `${API_BASE_URL}/scans/${_id}`
  return placeholderProductAnalysis;
}

const placeholderProductAnalysis: ProductAnalysisResult = {
  id: "scan-product-demo",
  productName: "Golden Harvest Corn Flakes",
  manufacturer: "NutriGrain Foods Ltd.",
  nafdacRegNo: "A1-4738",
  verified: true,
  gmoLikelihood: {
    level: "high",
    description:
      "Corn derivatives in this lot show a high likelihood of genetically modified origin based on sourcing region and ingredient records.",
  },
  ingredients: [
    { name: "Corn", note: "Primary grain, may come from GMO-dominant crops." },
    { name: "Sugar", note: "Refined cane or beet sugar." },
    { name: "Vegetable Oil", note: "Blend of sunflower and palm oil." },
    { name: "Soy Lecithin", note: "Emulsifier derived from soy." },
    { name: "Sea Salt", note: "Mined salt with minimal processing." },
  ],
  imageUrl: "",
};

/** One entry in the user's saved scan history. */
export type ScanHistoryItem = {
  id: string;
  productName: string;
  manufacturer: string;
  nafdacRegNo: string;
  scanDate: string;
  verified: boolean;
  gmoRisk: RiskLevel;
  imageUrl: string;
};

/** A page of scan history, with the total count for pagination. */
export type ScanHistoryPage = {
  items: ScanHistoryItem[];
  total: number;
};

/** Fetch the current user's saved scan history. */
export async function fetchScanHistoryPage(): Promise<ScanHistoryPage> {
  // TODO(backend): GET `${API_BASE_URL}/scans/history?page=1&limit=6`
  return { items: placeholderScanHistory, total: 24 };
}

const placeholderScanHistory: ScanHistoryItem[] = [
  {
    id: "hist-1",
    productName: "Golden Harvest Corn Flakes",
    manufacturer: "NutriGrain Foods Ltd.",
    nafdacRegNo: "A1-4738",
    scanDate: "Sep 21, 2026",
    verified: true,
    gmoRisk: "high",
    imageUrl: "",
  },
  {
    id: "hist-2",
    productName: "Peach Crush Juice Drink",
    manufacturer: "FreshVale Beverages",
    nafdacRegNo: "B4-2291",
    scanDate: "Sep 18, 2026",
    verified: true,
    gmoRisk: "low",
    imageUrl: "",
  },
  {
    id: "hist-3",
    productName: "Tomato & Chilli Sauce",
    manufacturer: "Spiceway Products",
    nafdacRegNo: "C7-8854",
    scanDate: "Sep 15, 2026",
    verified: true,
    gmoRisk: "low",
    imageUrl: "",
  },
  {
    id: "hist-4",
    productName: "Original Instant Noodles",
    manufacturer: "QuickNoodle Co.",
    nafdacRegNo: "D2-1107",
    scanDate: "Sep 12, 2026",
    verified: false,
    gmoRisk: "high",
    imageUrl: "",
  },
  {
    id: "hist-5",
    productName: "Coconut Body Lotion",
    manufacturer: "GlowLeaf Cosmetics",
    nafdacRegNo: "F9-3360",
    scanDate: "Sep 9, 2026",
    verified: true,
    gmoRisk: "medium",
    imageUrl: "",
  },
  {
    id: "hist-6",
    productName: "Fortified Soy Flour",
    manufacturer: "NutriCore Mills",
    nafdacRegNo: "G3-7752",
    scanDate: "Sep 6, 2026",
    verified: false,
    gmoRisk: "medium",
    imageUrl: "",
  },
];

export type NotificationSettings = {
  scanAlerts: boolean;
  gmoWarnings: boolean;
  productRecalls: boolean;
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
    scanAlerts: true,
    gmoWarnings: false,
    productRecalls: true,
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