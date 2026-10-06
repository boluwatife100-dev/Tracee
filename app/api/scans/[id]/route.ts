import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { getScanCollection } from "@/lib/mongodb";

export const runtime = "nodejs";

const MAX_OCR_TEXT_LENGTH = 150_000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid scan ID" }, { status: 400 });
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
    typeof (body as Record<string, unknown>).ocrText !== "string" ||
    ((body as Record<string, unknown>).ocrText as string).length >
      MAX_OCR_TEXT_LENGTH
  ) {
    return Response.json({ error: "Invalid label text" }, { status: 400 });
  }

  try {
    const scans = await getScanCollection();
    const result = await scans.updateOne(
      { _id: new ObjectId(id), userId, kind: "product" },
      {
        $set: {
          ocrText: (body as { ocrText: string }).ocrText,
          ocrReviewedAt: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      return Response.json({ error: "Scan not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update scan label text", error);
    return Response.json({ error: "Unable to save label text" }, { status: 500 });
  }
}