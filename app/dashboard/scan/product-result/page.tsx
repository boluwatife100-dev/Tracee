import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductAnalysis from "@/components/scan/ProductAnalysis";
import ClearanceRequest from "@/components/scan/ClearanceRequest";
import {
  getProductAnalysis,
  ProductAnalysisNotFoundError,
} from "@/lib/product-analysis";
import type { ProductAnalysisResult, NotificationSettings } from "@/lib/api";

export const metadata = {
  title: "Product report | Tracee",
  description: "A plain-language breakdown of a scanned product label.",
};

export default async function ProductResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const scanId = params.id;
  if (!scanId) notFound();

  const user = await currentUser();
  const userId = user?.id;
  if (!userId) notFound();

  let result: ProductAnalysisResult | null = null;
  let scanNotFound = false;
  try {
    result = await getProductAnalysis(scanId, userId);
  } catch (error) {
    if (error instanceof ProductAnalysisNotFoundError) {
      scanNotFound = true;
    } else {
      console.error("Could not render product scan report", error);
    }
  }
  if (scanNotFound) notFound();

  if (!result) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-forest/10 bg-white p-6">
          <h1 className="text-2xl font-bold text-forest">
            We couldn&apos;t build this report
          </h1>
          <p className="mt-2 text-sm leading-6 text-forest/70">
            Your scan is saved, but the report could not be loaded. Try again in
            a moment.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href={`/dashboard/scan/product-result?id=${encodeURIComponent(scanId)}`}
              className="text-forest underline underline-offset-4"
            >
              Try loading the report again
            </Link>
            <Link
              href="/dashboard/scan"
              className="text-forest/70 underline underline-offset-4"
            >
              Start another scan
            </Link>
          </div>
          <div className="mt-5">
            <ClearanceRequest scanId={scanId} clearance={null} />
          </div>
        </section>
      </main>
    );
  }

  // Handle notification settings
  const notifications = user.unsafeMetadata?.notifications as NotificationSettings | undefined;
  const hideGmo = notifications?.gmoWarnings === false;
  const hideFluoride = notifications?.fluorideWarnings === false;
  const hideAllergens = notifications?.allergenAlerts === false;
  const hideDietary = notifications?.dietaryAlerts === false;

  return (
    <ProductAnalysis
      result={result}
      hideGmo={hideGmo}
      hideFluoride={hideFluoride}
      hideAllergens={hideAllergens}
      hideDietary={hideDietary}
    />
  );
}
