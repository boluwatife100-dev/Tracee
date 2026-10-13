const INGREDIENT_SECTION_END = /\b(?:allergen information|allergy advice|may contain|contains|nutrition(?:al)? information|storage instructions|directions|warning|caution)\b/i;

export function normalizeIngredients(text: string): string[] {
  const ingredientMarker = /\b(?:ingredients?|composition)\s*[:\-]\s*/i;
  const marker = ingredientMarker.exec(text);
  let ingredientText = marker
    ? text.slice(marker.index + marker[0].length)
    : text;

  const sectionEnd = INGREDIENT_SECTION_END.exec(ingredientText);
  if (sectionEnd) ingredientText = ingredientText.slice(0, sectionEnd.index);

  const items: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < ingredientText.length; index += 1) {
    const character = ingredientText[index];
    if (character === "(" || character === "[") depth += 1;
    if (character === ")" || character === "]") depth = Math.max(0, depth - 1);
    if ((character === "," || character === ";" || character === "\n") && depth === 0) {
      const item = cleanIngredient(ingredientText.slice(start, index));
      if (item) items.push(item);
      start = index + 1;
    }
  }

  const finalItem = cleanIngredient(ingredientText.slice(start));
  if (finalItem) items.push(finalItem);
  return items;
}

export function flattenIngredients(ingredients: string[]): string[] {
  return ingredients.flatMap((ingredient) => normalizeIngredients(ingredient));
}

export function containsPhrase(text: string, phrase: string): boolean {
  const normalizedText = normalizeForMatch(text);
  const normalizedPhrase = normalizeForMatch(phrase);
  if (!normalizedPhrase) return false;
  return (` ${normalizedText} `).includes(` ${normalizedPhrase} `);
}

function cleanIngredient(value: string): string {
  return value
    .replace(/^\s*(?:ingredients?|composition)\s*[:\-]\s*/i, "")
    .replace(/^[\s,;:.\-]+|[\s,;:.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
