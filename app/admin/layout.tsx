import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isCurrentUserAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");

  const pendingCount = await prisma.clearanceRequest.count({
    where: { status: "pending" },
  });

  return (
    <div className="flex min-h-[100svh] flex-col bg-cream/40">
      <AdminHeader pendingCount={pendingCount} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
