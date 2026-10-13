import { containsPhrase, flattenIngredients } from "./normalize";

/**
 * Jargon -> plain-language allergen map. Extend this list as you see real
 * Nigerian-market labels. Matching is whole-phrase, never fuzzy, so a hit is
 * explainable ("matched 'casein'").
 */
export const ALLERGENS: Record<
  string,
  { label: string; aliases: string[] }
> = {
  milk: {
    label: "Milk",
    aliases: [
      "milk", "casein", "caseinate", "sodium caseinate", "calcium caseinate", "whey",
      "whey protein", "lactose", "lactalbumin", "lactoglobulin", "butter", "buttermilk",
      "cream", "ghee", "curd", "milk solids", "skimmed milk powder", "milk powder",
      "lactulose", "e966",
    ],
  },
  egg: {
    label: "Egg",
    aliases: ["egg", "egg white", "egg yolk", "albumen", "albumin", "ovalbumin", "ovomucoid", "lysozyme", "livetin", "e1105", "mayonnaise"],
  },
  peanut: {
    label: "Peanut (groundnut)",
    aliases: ["peanut", "peanuts", "groundnut", "groundnuts", "arachis oil", "arachis", "monkey nut", "earth nut"],
  },
  tree_nut: {
    label: "Tree nuts",
    aliases: ["almond", "hazelnut", "walnut", "cashew", "pecan", "pistachio", "brazil nut", "macadamia", "praline", "marzipan", "nougat", "nut paste", "kola nut"],
  },
  soy: {
    label: "Soy",
    aliases: ["soy", "soya", "soybean", "soybeans", "soy lecithin", "soya lecithin", "soy protein", "tofu", "tempeh", "edamame", "miso", "e322", "textured vegetable protein", "tvp"],
  },
  wheat_gluten: {
    label: "Wheat / gluten",
    aliases: ["wheat", "wheat flour", "gluten", "semolina", "durum", "spelt", "rye", "barley", "malt", "malt extract", "couscous", "farina", "seitan", "triticale", "flour"],
  },
  fish: {
    label: "Fish",
    aliases: ["fish", "anchovy", "cod", "tuna", "salmon", "fish sauce", "fish oil", "tilapia", "mackerel", "sardine", "stockfish"],
  },
  shellfish: {
    label: "Shellfish / crustaceans",
    aliases: ["shrimp", "prawn", "crab", "lobster", "crayfish", "shellfish", "krill", "langoustine", "chitosan"],
  },
  mollusc: {
    label: "Molluscs",
    aliases: ["mussel", "oyster", "clam", "squid", "octopus", "snail", "scallop", "abalone"],
  },
  sesame: {
    label: "Sesame",
    aliases: ["sesame", "sesame oil", "tahini", "benniseed", "gingelly", "til"],
  },
  mustard: { label: "Mustard", aliases: ["mustard", "mustard seed", "mustard flour"] },
  celery: { label: "Celery", aliases: ["celery", "celeriac"] },
  lupin: { label: "Lupin", aliases: ["lupin", "lupine"] },
  sulphites: {
    label: "Sulphites",
    aliases: ["sulphite", "sulfite", "sulphur dioxide", "sulfur dioxide", "sodium metabisulphite", "sodium metabisulfite", "potassium metabisulphite", "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228"],
  },
};

export type AllergenHit = {
  allergen: string;
  label: string;
  matchedTerm: string;
  ingredient: string;
  /** "contains" = in the ingredient list; "may_contain" = precautionary statement */
  tier: "contains" | "may_contain";
};

export function detectAllergens(
  ingredients: string[],
  mayContainText = ""
): AllergenHit[] {
  const hits: AllergenHit[] = [];
  const seen = new Set<string>();
  const flat = flattenIngredients(ingredients);

  const scan = (text: string, tier: AllergenHit["tier"]) => {
    for (const [key, def] of Object.entries(ALLERGENS)) {
      for (const alias of def.aliases) {
        if (containsPhrase(text, alias)) {
          const id = `${key}:${tier}`;
          if (seen.has(id)) break;
          seen.add(id);
          hits.push({ allergen: key, label: def.label, matchedTerm: alias, ingredient: text, tier });
          break;
        }
      }
    }
  };

  for (const item of flat) scan(item, "contains");
  if (mayContainText) scan(mayContainText.toLowerCase(), "may_contain");
  return hits;
}

/** Applies a user's saved allergen profile at read time. Never cached on Product. */
export function matchUserAllergens(hits: AllergenHit[], userAllergens: string[]) {
  const set = new Set(
    userAllergens.flatMap((allergen) => canonicalAllergenKeys(allergen))
  );
  return {
    mustAvoid: hits.filter((h) => set.has(h.allergen) && h.tier === "contains"),
    caution: hits.filter((h) => set.has(h.allergen) && h.tier === "may_contain"),
    otherPresent: hits.filter((h) => !set.has(h.allergen)),
  };
}

/**
 * Turns a profile label ("Peanuts", "Wheat", "Dairy", "Nuts") or a raw alias
 * ("casein") into canonical ALLERGENS keys. Without this, plural or label
 * spellings silently never match and the user is never alerted.
 */
const ALLERGEN_GROUP_SYNONYMS: Record<string, string[]> = {
  dairy: ["milk"],
  nuts: ["peanut", "tree_nut"],
  nut: ["peanut", "tree_nut"],
  gluten: ["wheat_gluten"],
  seafood: ["fish", "shellfish", "mollusc"],
  crustacean: ["shellfish"],
  crustaceans: ["shellfish"],
};

function canonicalAllergenKeys(value: string): string[] {
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!key) return [];
  const compact = key.replace(/ /g, "");

  const keys = new Set<string>();
  if (ALLERGENS[compact]) keys.add(compact);
  if (ALLERGENS[key.replace(/ /g, "_")]) keys.add(key.replace(/ /g, "_"));
  for (const synonym of ALLERGEN_GROUP_SYNONYMS[key] ?? []) keys.add(synonym);
  if (keys.size > 0) return [...keys];

  // Fall back to any alias or label that matches this (singular or plural).
  for (const [allergenKey, def] of Object.entries(ALLERGENS)) {
    const images = [allergenKey, def.label, ...def.aliases];
    for (const image of images) {
      const normalized = image.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (
        normalized === key ||
        `${normalized}s` === key ||
        (normalized.endsWith("s") && normalized.slice(0, -1) === key)
      ) {
        keys.add(allergenKey);
        break;
      }
    }
  }
  return [...keys];
}
