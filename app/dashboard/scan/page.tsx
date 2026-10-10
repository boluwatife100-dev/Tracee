import ScanCapture from "@/components/scan/ScanCapture";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialMode = type === "plant" ? "plant" : "product";

  return <ScanCapture initialMode={initialMode} />;
}