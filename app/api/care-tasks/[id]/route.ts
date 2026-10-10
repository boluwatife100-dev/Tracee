import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || id.length > 64) {
    return Response.json({ error: "Invalid care task ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).done !== "boolean"
  ) {
    return Response.json({ error: "A completion state is required." }, { status: 400 });
  }

  try {
    const result = await prisma.careTask.updateMany({
      where: { id, userId },
      data: {
        done: (body as { done: boolean }).done,
        doneAt: (body as { done: boolean }).done ? new Date() : null,
      },
    });
    if (!result.count) {
      return Response.json({ error: "Care task not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update care task", error);
    return Response.json({ error: "Unable to update care task." }, { status: 500 });
  }
}
