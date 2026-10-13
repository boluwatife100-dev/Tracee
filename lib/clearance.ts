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
  const select = { id: true, status: true, reason: true };
  const existing = await prisma.clearanceRequest.findUnique({
    where: { scanId },
    select,
  });
  if (existing) return existing;

  try {
    return await prisma.clearanceRequest.create({
      data: { scanId, reason, status: "pending" },
      select,
    });
  } catch (error) {
    // A concurrent pipeline path may have created the record first; the unique
    // scanId constraint guarantees we do not double-queue the scan.
    if ((error as { code?: string })?.code === "P2002") {
      return prisma.clearanceRequest.findUnique({ where: { scanId }, select });
    }
    throw error;
  }
}

/**
 * Submit (or resubmit) a user-initiated clearance request. Explicit user
 * actions may reopen a rejected request so a person can ask for another look.
 */
export async function requestUserClearance(
  scanId: string
): Promise<ClearanceInfo> {
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
    select: { id: true, status: true, reason: true },
  });
  return clearance;
}
