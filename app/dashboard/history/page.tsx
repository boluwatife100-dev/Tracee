import HistoryView from "@/components/history/HistoryView";
import { fetchScanHistoryPage } from "@/lib/scan-history";

export const metadata = {
  title: "Scan History — Tracee",
  description: "Browse your saved product scans in Tracee.",
};

export default async function HistoryPage() {
  const { items, total } = await fetchScanHistoryPage();

  return <HistoryView items={items} total={total} />;
}