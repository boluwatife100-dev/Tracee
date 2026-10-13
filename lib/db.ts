import "server-only";
import type { User } from "@clerk/nextjs/server";
import type { PreferenceSelection } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function syncTraceeUser(
  user: User,
  selection?: PreferenceSelection
): Promise<void> {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  const profile = {
    email: primaryEmail?.emailAddress ?? null,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    lastSignInAt:
      user.lastSignInAt === null ? null : new Date(user.lastSignInAt),
  };

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      ...profile,
      createdAt: new Date(user.createdAt),
      allergies: selection?.allergies ?? [],
      dietary: selection?.dietary ?? [],
      onboardingCompleted: Boolean(selection),
    },
    update: {
      ...profile,
      ...(selection
        ? {
            allergies: selection.allergies,
            dietary: selection.dietary,
            onboardingCompleted: true,
          }
        : {}),
    },
  });

  if (selection) {
    await prisma.allergenProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        allergens: selection.allergies,
      },
      update: {
        allergens: selection.allergies,
      },
    });
  }
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const record = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });

  return record?.onboardingCompleted === true;
}
