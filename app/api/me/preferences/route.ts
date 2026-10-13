import { auth, currentUser } from "@clerk/nextjs/server";
import { syncTraceeUser } from "@/lib/db";

export const runtime = "nodejs";

type PreferenceSelection = {
  allergies: string[];
  dietary: string[];
};

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.length <= 100
    )
  );
}

function parseSelection(value: unknown): PreferenceSelection | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const selection = value as Record<string, unknown>;
  if (!isStringArray(selection.allergies) || !isStringArray(selection.dietary)) {
    return null;
  }

  return {
    allergies: [...new Set(selection.allergies.map((item) => item.trim()))],
    dietary: [...new Set(selection.dietary.map((item) => item.trim()))],
  };
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const selection = parseSelection(body);
  if (!selection) {
    return Response.json({ error: "Invalid preferences" }, { status: 400 });
  }

  try {
    const user = await currentUser();
    if (!user || user.id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncTraceeUser(user, selection);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to save user preferences", error);
    return Response.json(
      { error: "Unable to save preferences" },
      { status: 500 }
    );
  }
}