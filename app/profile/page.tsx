import AppShell from "@/components/dashboard/AppShell";
import ProfileView from "@/components/profile/ProfileView";
import { fetchProfile } from "@/lib/api";

export const metadata = {
  title: "User Profile — Tracee",
  description:
    "Your Tracee account profile, preferences, notification settings, and account management.",
};

export default async function ProfilePage() {
  const profile = await fetchProfile();

  return (
    <AppShell title="User Profile" active="profile">
      <ProfileView profile={profile} />
    </AppShell>
  );
}