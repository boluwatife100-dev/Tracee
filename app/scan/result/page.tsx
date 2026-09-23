import AppShell from "@/components/dashboard/AppShell";
import PlantAnalysis from "@/components/scan/PlantAnalysis";
import { fetchPlantScan } from "@/lib/api";

export const metadata = {
  title: "Plant Analysis — Tracee",
  description: "Your plant scan diagnosis, symptoms, and treatment plan.",
};

export default async function ScanResultPage() {
  const result = await fetchPlantScan();

  return (
    <AppShell title="Plant Analysis" active="scan">
      <PlantAnalysis result={result} />
    </AppShell>
  );
}