import Personalization from "@/components/preferences/Personalization";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOnboardingComplete, syncTraceeUser } from "@/lib/mongodb";

export const metadata = {
  title: "Your Preferences — Tracee",
  description:
    "Tell Tracee what matters to you so it can give you more relevant results.",
};

export default async function PreferencesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/signup");
  }

  const user = await currentUser();
  if (!user || user.id !== userId) {
    redirect("/signup");
  }

  await syncTraceeUser(user);

  if (await isOnboardingComplete(userId)) {
    redirect("/dashboard");
  }

  return <Personalization />;
}