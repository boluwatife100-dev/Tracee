import Personalization from "@/components/preferences/Personalization";

export const metadata = {
  title: "Your Preferences — Tracee",
  description:
    "Tell Tracee what matters to you so it can give you more relevant results.",
};

export default function PreferencesPage() {
  return <Personalization />;
}