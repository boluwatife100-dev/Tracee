import { flattenIngredients } from "./normalize";

export type OpenFoodFactsResult = {
  productName?: string;
  brands?: string;
  ingredientsText?: string;
  ingredients: string[];
  imageFrontUrl?: string;
};

export async function fetchFromOpenFoodFacts(barcode: string): Promise<OpenFoodFactsResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: {
        "User-Agent": "TraceeApp/0.1.0"
      },
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;
    return {
      productName: p.product_name,
      brands: p.brands,
      ingredientsText: p.ingredients_text,
      ingredients: p.ingredients_tags ? p.ingredients_tags.map((t: string) => t.replace(/^[a-z]+:/i, "").replace(/-/g, " ")) : [],
      imageFrontUrl: p.image_front_url,
    };
  } catch (err) {
    console.error("OpenFoodFacts fetch error", err);
    return null;
  }
}

