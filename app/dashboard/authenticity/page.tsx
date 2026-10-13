import AuthenticityCapture from "@/components/scan/AuthenticityCapture";

export const metadata = {
  title: "Authenticity Check — Tracee",
  description:
    "Compare product-label details with available NAFDAC registration records.",
};

export default function AuthenticityPage() {
  return <AuthenticityCapture />;
}
