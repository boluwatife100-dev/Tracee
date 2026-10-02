import ProfileView from "@/components/profile/ProfileView";
import { fetchProfile } from "@/lib/api";

export const metadata = {
  title: "User Profile — Tracee",
  description:
    "Your Tracee account profile, preferences, notification settings, and account management.",
};

export default async function ProfilePage() {
  const profile = await fetchProfile();

  return <ProfileView profile={profile} />;
}