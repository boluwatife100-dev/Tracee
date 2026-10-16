"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, AlertCircle } from "lucide-react";
import { useCredits } from "@/components/credits/CreditsContext";

export default function MobileCreditWidget() {
  const pathname = usePathname();
  const { credits, maxCredits, loading } = useCredits();

  // Hide on the credits page itself to reduce clutter
  if (pathname === "/dashboard/credits") {
    return null;
  }

  const isLow = credits <= 2 && credits > 0;
  const isExhausted = credits === 0;

  return (
    <aside
      aria-label="Credit balance floating shortcut"
      className="fixed bottom-20 right-4 z-30 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link
        href="/dashboard/credits"
        className={`group flex items-center gap-2 rounded-full border px-3.5 py-2 shadow-lg backdrop-blur-md transition-all active:scale-95 ${
          isExhausted
            ? "border-red-300 bg-red-600 text-white shadow-red-950/20"
            : isLow
              ? "border-amber-300 bg-amber-500 text-forest-dark shadow-amber-900/20"
              : "border-forest/20 bg-forest text-white shadow-forest/25 hover:bg-forest-dark"
        }`}
      >
        {isExhausted ? (
          <AlertCircle className="size-4 shrink-0 text-white animate-bounce" />
        ) : (
          <Sparkles className="size-4 shrink-0 text-sage" />
        )}
        <span className="text-xs font-bold tracking-tight">
          {loading ? "…" : credits}{" "}
          <span className="font-medium opacity-85">
            / {maxCredits} {credits === 1 ? "credit" : "credits"}
          </span>
        </span>
      </Link>
    </aside>
  );
}
