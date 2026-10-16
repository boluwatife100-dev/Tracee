import "server-only";

import { prisma } from "@/lib/prisma";
import type { ClearanceInfo } from "@/lib/api";

/** Why a scan was sent to the admin clearance queue. */
export type ClearanceReason =
  | "insufficient_evidence"
  | "no_catalog_match"
  | "user_request";

/**
 * Open a clearance request for a scan without disturbing a decision that an
 * admin has already made. Used by the scanning pipeline when a scan flags for
 * review, so a record always exists for the admin queue.
 */
export async function ensurePendingClearance(
  scanId: string,
  reason: ClearanceReason
): Promise<ClearanceInfo | null> {
  const select = {
    id: true,
    status: true,
    reason: true,
    adminNote: true,
    reviewedAt: true,
  };
  const existing = await prisma.clearanceRequest.findUnique({
    where: { scanId },
    select,
  });
  if (existing) {
    return {
      ...existing,
      reviewedAt: existing.reviewedAt ? existing.reviewedAt.toISOString() : null,
    };
  }

  try {
    const created = await prisma.clearanceRequest.create({
      data: { scanId, reason, status: "pending" },
      select,
    });
    return {
      ...created,
      reviewedAt: created.reviewedAt ? created.reviewedAt.toISOString() : null,
    };
  } catch (error) {
    // A concurrent pipeline path may have created the record first; the unique
    // scanId constraint guarantees we do not double-queue the scan.
    if ((error as { code?: string })?.code === "P2002") {
      const found = await prisma.clearanceRequest.findUnique({ where: { scanId }, select });
      return found
        ? {
            ...found,
            reviewedAt: found.reviewedAt ? found.reviewedAt.toISOString() : null,
          }
        : null;
    }
    throw error;
  }
}

/**
 * Submit (or resubmit) a user-initiated clearance request.
 * If an admin has already made a terminal decision (cleared or rejected),
 * it cannot be reopened.
 */
export async function requestUserClearance(
  scanId: string
): Promise<ClearanceInfo> {
  const existing = await prisma.clearanceRequest.findUnique({
    where: { scanId },
    select: { status: true },
  });

  if (existing?.status === "cleared" || existing?.status === "rejected") {
    throw new Error(
      "This review has already been finalized by an admin and cannot be reopened."
    );
  }

  const clearance = await prisma.clearanceRequest.upsert({
    where: { scanId },
    create: { scanId, reason: "user_request", status: "pending" },
    update: {
      reason: "user_request",
      status: "pending",
      adminNote: null,
      reviewedBy: null,
      reviewedAt: null,
    },
    select: {
      id: true,
      status: true,
      reason: true,
      adminNote: true,
      reviewedAt: true,
    },
  });

  try {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "needs_review" },
    });
  } catch (scanUpdateError) {
    console.error("Failed to set scan status to needs_review upon user clearance request", scanUpdateError);
  }

  return {
    ...clearance,
    reviewedAt: clearance.reviewedAt ? clearance.reviewedAt.toISOString() : null,
  };
}
