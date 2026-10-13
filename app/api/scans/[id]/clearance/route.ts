import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requestUserClearance } from "@/lib/clearance";

export const runtime = "nodejs";

async function ownedScan(scanId: string, userId: string) {
  return prisma.scan.findFirst({
    where: { id: scanId, userId },
    select: { id: true, clearance: { select: { id: true, status: true, reason: true } } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || id.length > 64) {
    return Response.json({ error: "Invalid scan ID" }, { status: 400 });
  }

  const scan = await ownedScan(id, userId);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });

  return Response.json({ clearance: scan.clearance ?? null });
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

  const scan = await prisma.scan.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });

  try {
    const clearance = await requestUserClearance(scan.id);
    return Response.json({ clearance }, { status: 201 });
  } catch (error) {
    console.error("Failed to request scan clearance", error);
    return Response.json(
      { error: "Unable to send this scan for review. Please try again." },
      { status: 500 }
    );
  }
}
