import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOnboardingComplete, syncTraceeUser } from "@/lib/mongodb";

export default async function AuthSyncPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const user = await currentUser();
  if (!user || user.id !== userId) {
    redirect("/login");
  }

  await syncTraceeUser(user);

  redirect(
    (await isOnboardingComplete(userId)) ? "/dashboard" : "/preferences"
  );
}