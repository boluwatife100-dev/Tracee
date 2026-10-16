import { auth } from "@clerk/nextjs/server";
import { DEFAULT_CREDITS, getUserCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const credits = await getUserCredits(userId);
    return Response.json({
      credits,
      maxCredits: DEFAULT_CREDITS,
    });
  } catch (error) {
    console.error("Failed to fetch credits", error);
    return Response.json({ error: "Unable to retrieve credits" }, { status: 500 });
  }
}
