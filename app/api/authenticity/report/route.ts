import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Invalid product report." }, { status: 400 });
  }
  const values = body as Record<string, unknown>;
  if (
    typeof values.checkId !== "string" ||
    values.checkId.length > 64 ||
    typeof values.note !== "string" ||
    values.note.trim().length < 5 ||
    values.note.trim().length > 2000 ||
    (values.extraPhotoId !== undefined &&
      values.extraPhotoId !== null &&
      (typeof values.extraPhotoId !== "string" ||
        !values.extraPhotoId.startsWith(`${userId}_`) ||
        values.extraPhotoId.length > 300))
  ) {
    return Response.json(
      { error: "Invalid product report details." },
      { status: 400 }
    );
  }

  try {
    const check = await prisma.authenticityCheck.findFirst({
      where: { id: values.checkId, userId },
      select: { id: true },
    });
    if (!check) return Response.json({ error: "Check not found." }, { status: 404 });

    const report = await prisma.productReport.create({
      data: {
        checkId: check.id,
        userId,
        note: values.note.trim(),
        extraPhotoId:
          typeof values.extraPhotoId === "string" ? values.extraPhotoId : null,
      },
      select: { id: true, createdAt: true },
    });
    return Response.json(
      { reportId: report.id, createdAt: report.createdAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create product report", error);
    return Response.json(
      { error: "Unable to save the product report." },
      { status: 500 }
    );
  }
}
