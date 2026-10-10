import { readFileSync } from "node:fs";
import path from "node:path";

export type GmoAlias = { crop: string; alias: string };

let cache: GmoAlias[] | null = null;

/** Loads data/gmo_reference_lookup.csv (crop,ingredient_alias). */
export function loadGmoReference(): GmoAlias[] {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "product-catalog", "gmo_reference_lookup.csv");
  const lines = readFileSync(file, "utf8").split(/\r?\n/).slice(1);
  cache = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(",");
      return { crop: l.slice(0, i).trim(), alias: l.slice(i + 1).trim().toLowerCase() };
    })
    // Longest alias first so "high fructose corn syrup" wins over "corn syrup".
    .sort((a, b) => b.alias.length - a.alias.length);
  return cache;
}
