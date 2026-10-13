import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ExtractionSchema } from "@/lib/extraction";
import { prisma } from "@/lib/prisma";
import type { RiskLevel, ScanHistoryPage } from "@/lib/api";
import { getAuthenticatedScanImageUrl } from "@/lib/scan-image";

export async function fetchScanHistoryPage(): Promise<ScanHistoryPage> {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const scans = await prisma.scan.findMany({
    where: { userId, kind: "product" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      photoIds: true,
      extraction: true,
      createdAt: true,
      product: {
        select: {
          name: true,
          brand: true,
          nafdacNo: true,
          verdicts: true,
        },
      },
    },
  });

  const items = scans.map((scan) => {
    const extraction = ExtractionSchema.safeParse(scan.extraction);
    const fields = extraction.success ? extraction.data : null;
    const verdicts = asRecord(scan.product?.verdicts);

    return {
      id: scan.id,
      productName:
        scan.product?.name || fields?.productName || "Scanned product",
      manufacturer:
        fields?.manufacturer || fields?.brand || scan.product?.brand || "Manufacturer unavailable",
      nafdacRegNo:
        scan.product?.nafdacNo || fields?.nafdacNo || "Not captured",
      scanDate: new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
      }).format(scan.createdAt),
      status: historyStatus(scan.status),
      gmoRisk: riskLevel(verdicts?.gmo),
      fluorideLikelihood: riskLevel(verdicts?.fluoride),
      imageUrl: getAuthenticatedScanImageUrl(scan.photoIds) ?? "",
    };
  });

  return { items, total: items.length };
}

function historyStatus(
  status: string
): ScanHistoryPage["items"][number]["status"] {
  if (status === "analyzed") return "analyzed";
  if (
    status === "pending" ||
    status === "analyzing" ||
    status === "awaiting_catalog"
  ) {
    return "processing";
  }
  if (status === "needs_review") return "needs-review";
  if (status === "failed") return "failed";
  return "saved";
}

function riskLevel(value: unknown): RiskLevel | null {
  const record = asRecord(value);
  const risk = record?.risk;
  if (risk === "high" || risk === "low") return risk;
  if (risk === "moderate" || risk === "medium") return "medium";
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
