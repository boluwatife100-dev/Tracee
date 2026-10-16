import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import PlantAnalysis, {
  type PlantAnalysisView,
} from "@/components/scan/PlantAnalysis";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedScanImageUrl } from "@/lib/scan-image";
import {
  asRecord,
  parsePlantCandidates,
  parsePlantFindings,
} from "@/lib/plant-types";

export const metadata = {
  title: "Plant Scan — Tracee",
  description: "Plant identification, health candidates, and care recommendations.",
};

export default async function PlantScanPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { scanId } = await params;
  const scan = await prisma.scan.findFirst({
    where: { id: scanId, userId, kind: "plant" },
    include: {
      plant: {
        include: {
          tasks: { orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
        },
      },
      clearance: {
        select: {
          id: true,
          status: true,
          reason: true,
          adminNote: true,
          reviewedAt: true,
        },
      },
    },
  });
  if (!scan) notFound();

  const candidates = parsePlantCandidates(scan.plant?.candidates);
  const findings = parsePlantFindings(scan.plant?.diagnosis);
  const storedPlantContext = asRecord(scan.plantContext);
  const plantNameHint =
    typeof storedPlantContext?.name === "string"
      ? storedPlantContext.name
      : null;
  const topDisease = findings.diseases[0];
  const result: PlantAnalysisView = {
    id: scan.id,
    status: scan.status,
    plantName:
      plantNameHint ?? candidates[0]?.commonName ?? candidates[0]?.species ?? "Plant scan",
    diagnosis: scan.plant?.needsBetterPhoto
      ? "A clearer photo is needed"
      : topDisease
        ? `Possible ${topDisease.name}`
        : scan.plant
          ? "Plant health assessment"
          : "Plant scan analysis",
    summary: scan.plant?.summary ?? null,
    candidates,
    diseases: findings.diseases,
    symptoms: findings.symptoms,
    needsBetterPhoto: scan.plant?.needsBetterPhoto ?? false,
    scanDate: scan.createdAt.toISOString(),
    imageUrl: getAuthenticatedScanImageUrl(scan.photoIds),
    tasks:
      scan.plant?.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        detail: task.detail,
        dueAt: task.dueAt?.toISOString() ?? null,
        recurrence: task.recurrence,
      })) ?? [],
    clearance: scan.clearance
      ? {
          ...scan.clearance,
          reviewedAt: scan.clearance.reviewedAt
            ? scan.clearance.reviewedAt.toISOString()
            : null,
        }
      : null,
  };

  return <PlantAnalysis result={result} />;
}
