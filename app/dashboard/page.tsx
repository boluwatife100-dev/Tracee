import AppShell from "@/components/dashboard/AppShell";
import ActionCards from "@/components/dashboard/ActionCards";
import LatestInsights from "@/components/dashboard/LatestInsights";
import CareChecklist from "@/components/dashboard/CareChecklist";
import { DEMO_USERNAME } from "@/lib/api";

export const metadata = {
  title: "Dashboard — Tracee",
  description: "Your overview of recent scans and plant care in Tracee.",
};

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" active="dashboard">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-forest">
            Hi {DEMO_USERNAME}!
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
    </AppShell>
  );
}