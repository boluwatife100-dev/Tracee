import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileView from "@/components/profile/ProfileView";
import type { NotificationSettings, UserProfile } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "User Profile — Tracee",
  description:
    "Your Tracee account profile, saved preferences, product scan settings, and account management.",
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  gmoWarnings: true,
  fluorideWarnings: true,
  allergenAlerts: true,
  dietaryAlerts: true,
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function notificationSettings(value: unknown): NotificationSettings {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_NOTIFICATIONS;
  }

  const saved = value as Partial<Record<keyof NotificationSettings, unknown>>;
  return {
    gmoWarnings:
      typeof saved.gmoWarnings === "boolean"
        ? saved.gmoWarnings
        : DEFAULT_NOTIFICATIONS.gmoWarnings,
    fluorideWarnings:
      typeof saved.fluorideWarnings === "boolean"
        ? saved.fluorideWarnings
        : DEFAULT_NOTIFICATIONS.fluorideWarnings,
    allergenAlerts:
      typeof saved.allergenAlerts === "boolean"
        ? saved.allergenAlerts
        : DEFAULT_NOTIFICATIONS.allergenAlerts,
    dietaryAlerts:
      typeof saved.dietaryAlerts === "boolean"
        ? saved.dietaryAlerts
        : DEFAULT_NOTIFICATIONS.dietaryAlerts,
  };
}

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const [user, savedPreferences] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { allergies: true, dietary: true },
    }),
  ]);

  if (!user || user.id !== userId) redirect("/login");

  const metadata = user.unsafeMetadata;
  const profile: UserProfile = {
    name:
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      "",
    email:
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "",
    premiumMember: false,
    allergies:
      savedPreferences?.allergies ?? stringList(metadata.allergies),
    dietary: savedPreferences?.dietary ?? stringList(metadata.dietary),
    notifications: notificationSettings(metadata.notifications),
  };

  return <ProfileView profile={profile} />;
}