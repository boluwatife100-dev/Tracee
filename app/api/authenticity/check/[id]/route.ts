import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedScanImageUrl } from "@/lib/scan-image";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || id.length > 64) {
    return Response.json({ error: "Invalid check ID." }, { status: 400 });
  }

  try {
    const check = await prisma.authenticityCheck.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        state: true,
        reasons: true,
        aiReview: true,
        extractedFields: true,
        matchedRecord: true,
        imagePublicIds: true,
        registrySource: true,
        registryAvailable: true,
        nafdacRegNumber: true,
        barcodeValue: true,
        createdAt: true,
      },
    });
    if (!check) return Response.json({ error: "Check not found." }, { status: 404 });
    return Response.json({
      ...check,
      frontImageUrl: getAuthenticatedScanImageUrl(check.imagePublicIds),
      createdAt: check.createdAt.toISOString(),
      officialUrl:
        check.registrySource === "food_db"
          ? "https://nafdac.gov.ng/food-products-database/"
          : "https://greenbook.nafdac.gov.ng/",
    });
  } catch (error) {
    console.error("Failed to fetch authenticity check", error);
    return Response.json(
      { error: "Unable to load this authenticity check." },
      { status: 500 }
    );
  }
}
