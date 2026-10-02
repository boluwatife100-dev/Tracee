"use client"
import ActionCards from "@/components/dashboard/ActionCards";
import LatestInsights from "@/components/dashboard/LatestInsights";
import CareChecklist from "@/components/dashboard/CareChecklist";
import { DEMO_USERNAME } from "@/lib/api";
import { useUser } from "@clerk/nextjs";
import Button from "@/components/ui/Button";



export default function DashboardPage() {

  const {isSignedIn, user, isLoaded} = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading dashboard">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-forest" />
      </div>
    );
  }
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Not signed in gap-4">
        <p className="text-lg text-gray-500">
          Please sign in to view your dashboard.
        </p>
        <Button href="/login" variant="secondary" className="rounded-lg border p-4 text-sm font-semibold text-forest hover:bg-forest/10 transition-colors">
          Sign In
        </Button>
      </div>
    );
  }
const userName = user?.firstName ;
  return (
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-forest">
            Hi {userName}!
          </h2>
          <p className="text-base text-gray-500">
            Here&apos;s an overview of your recent scans and plant care.
          </p>
        </div>

        <ActionCards />

        <div className="grid gap-6 lg:grid-cols-2">
          <LatestInsights />
          <CareChecklist />
        </div>
      </div>
  );
}
