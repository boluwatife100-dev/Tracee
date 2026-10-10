import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Plant Analysis — Tracee",
  description: "Your plant scan diagnosis, symptoms, and treatment plan.",
};

export default async function ScanResultPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const scan = await prisma.scan.findFirst({
    where: { userId, kind: "plant" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  redirect(scan ? `/dashboard/my-plant/${scan.id}` : "/dashboard/my-plant");
}