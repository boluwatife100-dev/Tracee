import { containsPhrase, flattenIngredients } from "./normalize";

export type DietaryAssessment = {
  preference: string;
  status: "possible_conflict" | "no_obvious_conflict" | "unclear";
  explanation: string;
};

/**
 * Deterministic eating-preference checks. These run at read time from the
 * current user's saved preferences, so a result never disagrees with the
 * profile (unlike a fresh AI call per view). Matching is whole-phrase only, so
 * every conflict is explainable ("matched 'whey'").
 */
const RULES: Record<string, { label: string; conflict: string[] }> = {
  vegetarian: {
    label: "Vegetarian",
    conflict: [
      "meat", "beef", "chicken", "pork", "bacon", "ham", "sausage", "lamb", "goat",
      "poultry", "veal", "fish", "tuna", "salmon", "sardine", "mackerel", "anchovy",
      "tilapia", "stockfish", "shrimp", "prawn", "crab", "lobster", "crayfish",
      "gelatin", "gelatine", "lard", "tallow", "rennet", "carmine", "cochineal",
      "isinglass", "oyster sauce", "fish sauce", "worcestershire sauce",
    ],
  },
  vegan: {
    label: "Vegan",
    conflict: [
      "milk", "cheese", "butter", "cream", "whey", "casein", "caseinate", "lactose",
      "ghee", "curd", "buttermilk", "yoghurt", "yogurt", "egg", "egg white",
      "egg yolk", "albumen", "albumin", "honey", "beeswax", "shellac", "gelatin",
      "gelatine", "lard", "tallow", "carmine", "isinglass",
    ],
  },
  halal: {
    label: "Halal",
    conflict: [
      "pork", "bacon", "ham", "lard", "alcohol", "ethanol", "wine", "beer", "rum",
      "whisky", "whiskey", "brandy", "liqueur", "liquor",
    ],
  },
  kosher: {
    label: "Kosher",
    conflict: [
      "pork", "bacon", "ham", "lard", "shrimp", "prawn", "crab", "lobster",
      "shellfish", "clam", "oyster", "mussel", "squid", "octopus", "catfish",
    ],
  },
  gluten_free: {
    label: "Gluten-free",
    conflict: [
      "wheat", "gluten", "barley", "rye", "malt", "semolina", "durum", "spelt",
      "seitan", "couscous", "triticale", "farina", "wheat flour", "malt extract",
      "wheat starch", "wheat bran",
    ],
  },
  no_sugar: {
    label: "No sugar",
    conflict: [
      "sugar", "sucrose", "glucose", "fructose", "dextrose", "maltose", "molasses",
      "honey", "syrup", "corn syrup", "glucose syrup", "fructose syrup",
      "invert sugar", "malt extract", "maltodextrin", "cane sugar", "beet sugar",
    ],
  },
  dairy_free: {
    label: "Dairy-free",
    conflict: [
      "milk", "cheese", "butter", "cream", "whey", "casein", "caseinate", "lactose",
      "ghee", "curd", "buttermilk", "yoghurt", "yogurt", "milk solids", "milk powder",
    ],
  },
  egg_free: {
    label: "Egg-free",
    conflict: ["egg", "egg white", "egg yolk", "albumen", "albumin", "ovalbumin", "mayonnaise"],
  },
  nut_free: {
    label: "Nut-free",
    conflict: [
      "peanut", "groundnut", "arachis", "almond", "hazelnut", "walnut", "cashew",
      "pecan", "pistachio", "brazil nut", "macadamia", "praline", "marzipan",
      "nougat", "nut paste", "kola nut",
    ],
  },
  peanut: {
    label: "Peanuts",
    conflict: ["peanut", "groundnut", "arachis", "monkey nut", "earth nut"],
  },
  soy_free: {
    label: "Soy-free",
    conflict: [
      "soy", "soya", "soybean", "soy lecithin", "soya lecithin", "soy protein",
      "tofu", "tempeh", "edamame", "miso", "textured vegetable protein",
    ],
  },
  fish_free: {
    label: "Fish-free",
    conflict: [
      "fish", "anchovy", "cod", "tuna", "salmon", "fish sauce", "fish oil",
      "tilapia", "mackerel", "sardine", "stockfish",
    ],
  },
  shellfish_free: {
    label: "Shellfish-free",
    conflict: ["shrimp", "prawn", "crab", "lobster", "crayfish", "shellfish", "krill"],
  },
  sesame_free: {
    label: "Sesame-free",
    conflict: ["sesame", "sesame oil", "tahini", "benniseed", "gingelly", "til"],
  },
};

/** Maps the labels offered in the profile UI (and common variants) to a rule. */
const SYNONYMS: Record<string, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  halal: "halal",
  kosher: "kosher",
  glutenfree: "gluten_free",
  gluten: "gluten_free",
  celiac: "gluten_free",
  coeliac: "gluten_free",
  nosugar: "no_sugar",
  sugarfree: "no_sugar",
  dairyfree: "dairy_free",
  lactosefree: "dairy_free",
  eggfree: "egg_free",
  nutfree: "nut_free",
  nuts: "nut_free",
  treenut: "nut_free",
  treenuts: "nut_free",
  peanut: "peanut",
  peanuts: "peanut",
  groundnut: "peanut",
  groundnuts: "peanut",
  soyfree: "soy_free",
  soyafree: "soy_free",
  soy: "soy_free",
  soya: "soy_free",
  fishfree: "fish_free",
  fish: "fish_free",
  shellfishfree: "shellfish_free",
  shellfish: "shellfish_free",
  sesamefree: "sesame_free",
  sesame: "sesame_free",
};

function canonicalPreference(value: string): string | null {
  const key = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return SYNONYMS[key] ?? null;
}

export function assessDietaryPreferences(
  ingredients: string[],
  preferences: string[]
): DietaryAssessment[] {
  const flat = flattenIngredients(ingredients);
  return preferences.map((preference) => {
    const ruleKey = canonicalPreference(preference);
    const rule = ruleKey ? RULES[ruleKey] : undefined;

    if (!rule || flat.length === 0) {
      return {
        preference,
        status: "unclear",
        explanation: flat.length === 0
          ? "No ingredient list could be read, so this preference could not be checked."
          : `We don't yet have a check for "${preference}" from the label.`,
      };
    }

    const matched = new Set<string>();
    for (const item of flat) {
      for (const phrase of rule.conflict) {
        if (containsPhrase(item, phrase)) matched.add(phrase);
      }
    }

    if (matched.size > 0) {
      const terms = [...matched];
      return {
        preference,
        status: "possible_conflict",
        explanation: `${rule.label} may be affected: the label lists ${terms
          .map((term) => `"${term}"`)
          .join(", ")}.`,
      };
    }

    return {
      preference,
      status: "no_obvious_conflict",
      explanation: `No ingredient on the label obviously conflicts with ${rule.label}.`,
    };
  });
}
