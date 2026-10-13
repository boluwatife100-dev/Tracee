"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isCurrentUserAdmin } from "@/lib/admin";

const DECISIONS: Record<string, string> = {
  approve: "cleared",
  reject: "rejected",
  needs_info: "needs_info",
};

export async function reviewClearance(formData: FormData) {
  // Server actions are callable endpoints on their own, so re-check the admin
  // role here instead of trusting that the page was rendered for an admin.
  const { userId } = await auth();
  if (!userId || !(await isCurrentUserAdmin())) return;

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const status = DECISIONS[action];
  if (!id || !status) return;

  await prisma.clearanceRequest.update({
    where: { id },
    data: {
      status,
      adminNote: note || null,
      reviewedBy: userId,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/review");
}
