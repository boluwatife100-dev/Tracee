import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tasks = await prisma.careTask.findMany({
      where: { userId },
      orderBy: [
        { done: "asc" },
        { dueAt: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 20,
      include: { diagnosis: { select: { scanId: true } } },
    });
    return Response.json({
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        detail: task.detail,
        dueAt: task.dueAt?.toISOString() ?? null,
        recurrence: task.recurrence,
        done: task.done,
        scanId: task.diagnosis.scanId,
      })),
    });
  } catch (error) {
    console.error("Failed to load care tasks", error);
    return Response.json({ error: "Unable to load care tasks." }, { status: 500 });
  }
}
