import ProductAnalysis from "@/components/scan/ProductAnalysis";
import { fetchPreferences, fetchProductAnalysis } from "@/lib/api";

export const metadata = {
  title: "Product Analysis — Tracee",
  description:
    "Your product scan verdict, GMO likelihood, detected ingredients, and preferences match.",
};

export default async function ProductResultPage() {
  const [result, preferences] = await Promise.all([
    fetchProductAnalysis(),
    fetchPreferences(),
  ]);

  return <ProductAnalysis result={result} preferences={preferences} />;
}