import AppShell from "@/components/dashboard/AppShell";
import HistoryView from "@/components/history/HistoryView";
import { fetchScanHistoryPage } from "@/lib/api";

export const metadata = {
  title: "Scan History — Tracee",
  description: "Browse your saved product scans in Tracee.",
};

export default async function HistoryPage() {
  const { items, total } = await fetchScanHistoryPage();

  return (
    <AppShell title="Scan History" active="history">
      <HistoryView
        items={items}
        total={total}
      />
    </AppShell>
  );
}