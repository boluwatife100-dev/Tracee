import "server-only";
import { prisma } from "@/lib/prisma";

export const DEFAULT_CREDITS = 10;

/**
 * Retrieves the current credit balance for a user.
 * If the user does not exist in the database yet, initializes their profile with 10 credits.
 */
export async function getUserCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    const created = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        credits: DEFAULT_CREDITS,
      },
      update: {},
      select: { credits: true },
    });
    return created.credits;
  }

  return user.credits;
}

/**
 * Checks whether the user has at least 1 credit available to perform a scan.
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const balance = await getUserCredits(userId);
  return balance > 0;
}

/**
 * Deducts 1 credit for a successful product or plant scan.
 * Idempotent: If the scan has already had its credit deducted, does nothing.
 */
export async function deductCreditForScan(
  userId: string,
  scanId: string
): Promise<{ deducted: boolean; remainingCredits: number }> {
  return await prisma.$transaction(async (tx) => {
    // Ensure the user record exists
    const user = await tx.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        credits: DEFAULT_CREDITS,
      },
      update: {},
      select: { credits: true },
    });

    const scan = await tx.scan.findFirst({
      where: { id: scanId, userId },
      select: { id: true, creditDeducted: true },
    });

    if (!scan) {
      return { deducted: false, remainingCredits: user.credits };
    }

    // Already deducted for this scan
    if (scan.creditDeducted) {
      return { deducted: false, remainingCredits: user.credits };
    }

    // Check if user has at least 1 credit
    if (user.credits <= 0) {
      return { deducted: false, remainingCredits: user.credits };
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 1,
        },
      },
      select: { credits: true },
    });

    await tx.scan.update({
      where: { id: scanId },
      data: { creditDeducted: true },
    });

    return { deducted: true, remainingCredits: updatedUser.credits };
  });
}

/**
 * Deducts 1 credit for a successful authenticity check.
 * Idempotent: If the check has already had its credit deducted, does nothing.
 */
export async function deductCreditForAuthenticity(
  userId: string,
  checkId: string
): Promise<{ deducted: boolean; remainingCredits: number }> {
  return await prisma.$transaction(async (tx) => {
    // Ensure the user record exists
    const user = await tx.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        credits: DEFAULT_CREDITS,
      },
      update: {},
      select: { credits: true },
    });

    const check = await tx.authenticityCheck.findFirst({
      where: { id: checkId, userId },
      select: { id: true, creditDeducted: true },
    });

    if (!check) {
      return { deducted: false, remainingCredits: user.credits };
    }

    // Already deducted for this check
    if (check.creditDeducted) {
      return { deducted: false, remainingCredits: user.credits };
    }

    // Check if user has at least 1 credit
    if (user.credits <= 0) {
      return { deducted: false, remainingCredits: user.credits };
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 1,
        },
      },
      select: { credits: true },
    });

    await tx.authenticityCheck.update({
      where: { id: checkId },
      data: { creditDeducted: true },
    });

    return { deducted: true, remainingCredits: updatedUser.credits };
  });
}
