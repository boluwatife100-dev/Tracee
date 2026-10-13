import { auth } from "@clerk/nextjs/server";
import {
  getProductAnalysis,
  ProductAnalysisNotFoundError,
} from "@/lib/product-analysis";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    return Response.json(await getProductAnalysis(id, userId));
  } catch (error) {
    if (error instanceof ProductAnalysisNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    console.error("Failed to build product scan report", error);
    return Response.json(
      { error: "Unable to build this product report. Please try again." },
      { status: 500 }
    );
  }
}
