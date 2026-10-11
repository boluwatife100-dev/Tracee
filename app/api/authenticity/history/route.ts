import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const checks = await prisma.authenticityCheck.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        state: true,
        status: true,
        nafdacRegNumber: true,
        extractedFields: true,
        matchedRecord: true,
        registryAvailable: true,
        registrySource: true,
        barcodeValue: true,
        reasons: true,
        aiReview: true,
        createdAt: true,
      },
    });
    return Response.json({
      checks: checks.map((check) => ({
        ...check,
        createdAt: check.createdAt.toISOString(),
        officialUrl:
          check.registrySource === "food_db"
            ? "https://nafdac.gov.ng/food-products-database/"
            : "https://greenbook.nafdac.gov.ng/",
      })),
    });
  } catch (error) {
    console.error("Failed to fetch authenticity history", error);
    return Response.json(
      { error: "Unable to load authenticity history." },
      { status: 500 }
    );
  }
}
