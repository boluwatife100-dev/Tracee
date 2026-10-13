import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { diagnosePlant } from "@/lib/plant-diagnosis";
import { ensurePendingClearance } from "@/lib/clearance";

export const runtime = "nodejs";
export const maxDuration = 120;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || id.length > 64) {
    return Response.json({ error: "Invalid scan ID" }, { status: 400 });
  }

  try {
    const scan = await prisma.scan.findFirst({
      where: { id, userId, kind: "plant" },
      include: { plant: true },
    });
    if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
    if (scan.plant) {
      return Response.json({
        scanId: scan.id,
        needsBetterPhoto: scan.plant.needsBetterPhoto,
      });
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "analyzing" },
    });

    const photoIds = asRecord(scan.photoIds);
    if (!photoIds) throw new Error("The scan does not contain valid photo references.");
    const storedContext = asRecord(scan.plantContext);
    const context = {
      watering:
        typeof storedContext?.watering === "string"
          ? storedContext.watering
          : "unsure",
      light:
        typeof storedContext?.light === "string" ? storedContext.light : "unsure",
      ...(typeof storedContext?.name === "string" && storedContext.name.trim()
        ? { name: storedContext.name.trim().slice(0, 100) }
        : {}),
      ...(typeof storedContext?.leafDescription === "string" &&
      storedContext.leafDescription.trim()
        ? { leafDescription: storedContext.leafDescription.trim().slice(0, 1000) }
        : {}),
    };
    const result = await diagnosePlant(
      {
        whole: typeof photoIds.whole === "string" ? photoIds.whole : undefined,
        closeUp: typeof photoIds.closeUp === "string" ? photoIds.closeUp : undefined,
        underside:
          typeof photoIds.underside === "string" ? photoIds.underside : undefined,
        front: typeof photoIds.front === "string" ? photoIds.front : undefined,
      },
      context
    );

    const createdAt = new Date();
    await prisma.$transaction(async (transaction) => {
      await transaction.plantDiagnosis.upsert({
        where: { scanId: scan.id },
        create: {
          scanId: scan.id,
          candidates: result.candidates,
          diagnosis: { diseases: result.diseases, symptoms: result.symptoms },
          needsBetterPhoto: result.needsBetterPhoto,
          summary: result.summary,
          tasks: {
            create: result.tasks.map((task) => ({
              userId,
              title: task.title,
              detail: task.detail,
              dueAt: new Date(createdAt.getTime() + task.dueInDays * 86_400_000),
              recurrence: task.recurrence,
            })),
          },
        },
        update: {
          candidates: result.candidates,
          diagnosis: { diseases: result.diseases, symptoms: result.symptoms },
          needsBetterPhoto: result.needsBetterPhoto,
          summary: result.summary,
        },
      });
      await transaction.scan.update({
        where: { id: scan.id },
        data: { status: result.needsBetterPhoto ? "needs_review" : "analyzed" },
      });
    });

    if (result.needsBetterPhoto) {
      try {
        await ensurePendingClearance(scan.id, "insufficient_evidence");
      } catch (clearanceError) {
        console.error("Failed to queue plant scan for review", clearanceError);
      }
    }

    return Response.json({
      scanId: scan.id,
      needsBetterPhoto: result.needsBetterPhoto,
    });
  } catch (error) {
    console.error("Failed to diagnose plant scan", error);
    try {
      const failed = await prisma.scan.updateMany({
        where: { id, userId, kind: "plant", status: "analyzing" },
        data: { status: "failed" },
      });
      if (failed.count) {
        await ensurePendingClearance(id, "insufficient_evidence");
      }
    } catch (statusError) {
      console.error("Failed to mark plant scan as failed", statusError);
    }
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to analyze this plant scan.",
      },
      { status: 502 }
    );
  }
}
