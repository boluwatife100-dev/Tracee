import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  asRecord,
  parsePlantCandidates,
  parsePlantFindings,
} from "@/lib/plant-types";

export const runtime = "nodejs";

const LIMIT = 10;

const AUTHENTICITY_LABELS: Record<string, string> = {
  VERIFIED_REGISTRATION: "Registration details matched",
  MISMATCH: "Registration details differ",
  NOT_FOUND: "Registration number not found",
  INSUFFICIENT_EVIDENCE: "Could not be verified",
};

export type ActivityEntry = {
  id: string;
  kind: "plant" | "product" | "authenticity";
  title: string;
  detail: string;
  tag: string | null;
  href: string;
  createdAt: string;
};

type ProductScanRow = {
  id: string;
  status: string;
  createdAt: Date;
  product: { name: string | null; verdicts: unknown } | null;
  extraction: unknown;
};

type PlantScanRow = {
  id: string;
  createdAt: Date;
  plant: { candidates: unknown; diagnosis: unknown } | null;
};

type AuthenticityCheckRow = {
  id: string;
  state: string;
  nafdacRegNumber: string | null;
  extractedFields: unknown;
  createdAt: Date;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [productScans, plantScans, checks] = await Promise.all([
      prisma.scan.findMany({
        where: { userId, kind: "product" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: {
          id: true,
          status: true,
          createdAt: true,
          product: { select: { name: true, verdicts: true } },
          extraction: true,
        },
      }),
      prisma.scan.findMany({
        where: { userId, kind: "plant" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: {
          id: true,
          createdAt: true,
          plant: { select: { candidates: true, diagnosis: true } },
        },
      }),
      prisma.authenticityCheck.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        select: {
          id: true,
          state: true,
          nafdacRegNumber: true,
          extractedFields: true,
          createdAt: true,
        },
      }),
    ]);

    const entries: ActivityEntry[] = [
      ...plantScans.map(toPlantEntry),
      ...productScans.map(toProductEntry),
      ...checks.map(toAuthenticityEntry),
    ];
    entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return Response.json({ items: entries.slice(0, LIMIT) });
  } catch (error) {
    console.error("Failed to fetch dashboard activity", error);
    return Response.json(
      { error: "Unable to load recent activity." },
      { status: 500 }
    );
  }
}

function toProductEntry(scan: ProductScanRow): ActivityEntry {
  const extraction = asRecord(scan.extraction);
  const name =
    scan.product?.name ??
    (typeof extraction?.productName === "string"
      ? extraction.productName
      : null) ??
    "Product label";

  return {
    id: scan.id,
    kind: "product",
    title: "Product scanned",
    detail: name,
    tag: productTag(scan.status, scan.product?.verdicts),
    href: "/dashboard/history",
    createdAt: scan.createdAt.toISOString(),
  };
}

function productTag(status: string, verdicts: unknown): string | null {
  const verdictsRecord = asRecord(verdicts);
  const risks = Object.values(verdictsRecord ?? {}).flatMap((value) => {
    const risk = asRecord(value)?.risk;
    return risk === "high" || risk === "medium" || risk === "low"
      ? [risk]
      : [];
  });
  if (risks.includes("high")) return "Caution";
  if (status === "analyzed" && risks.length > 0) return "Safe";
  return null;
}

function toPlantEntry(scan: PlantScanRow): ActivityEntry {
  const candidates = parsePlantCandidates(scan.plant?.candidates);
  const findings = parsePlantFindings(scan.plant?.diagnosis);
  const plantName =
    candidates[0]?.commonName ?? candidates[0]?.species ?? "Plant scan";
  const topDisease = findings.diseases[0];
  const confidence = topDisease?.confidence ?? candidates[0]?.confidence;
  const detail = topDisease
    ? confidence
      ? `${plantName} — ${topDisease.name} · ${Math.round(confidence * 100)}%`
      : `${plantName} — ${topDisease.name}`
    : plantName;

  return {
    id: scan.id,
    kind: "plant",
    title: topDisease ? "Plant diagnosed" : "Plant scanned",
    detail,
    tag: null,
    href: `/dashboard/my-plant/${scan.id}`,
    createdAt: scan.createdAt.toISOString(),
  };
}

function toAuthenticityEntry(check: AuthenticityCheckRow): ActivityEntry {
  const fields = asRecord(check.extractedFields);
  const name =
    typeof fields?.productName === "string" ? fields.productName : null;

  return {
    id: check.id,
    kind: "authenticity",
    title: AUTHENTICITY_LABELS[check.state] ?? "Product check complete",
    detail: name ?? check.nafdacRegNumber ?? "Product label",
    tag: check.state === "VERIFIED_REGISTRATION" ? "Matched" : null,
    href: "/dashboard/authenticity",
    createdAt: check.createdAt.toISOString(),
  };
}