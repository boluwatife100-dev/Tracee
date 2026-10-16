"use client";

import Link from "next/link";
import { Sparkles, Plus, AlertCircle } from "lucide-react";
import { useCredits } from "@/components/credits/CreditsContext";

export default function CreditBalanceWidget() {
  const { credits, maxCredits, loading } = useCredits();

  const percentage = Math.min(
    100,
    Math.max(0, Math.round((credits / (maxCredits || 10)) * 100))
  );

  const isLow = credits <= 2 && credits > 0;
  const isExhausted = credits === 0;

  const barColor = isExhausted
    ? "bg-red-500"
    : isLow
      ? "bg-gold"
      : "bg-leaf";

  return (
    <div className="w-full">
      {/* Expanded view (visible on lg when sidebar is not collapsed) */}
      <div className="hidden flex-col gap-2.5 rounded-xl border border-forest/10 bg-white/90 p-3 shadow-xs lg:group-data-[collapsed=false]/sidebar:flex">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 font-semibold text-forest">
            <Sparkles className="size-3.5 text-leaf" aria-hidden="true" />
            Credits
          </span>
          <Link
            href="/dashboard/credits"
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-leaf transition-colors hover:text-forest"
            title="Purchase or top up credits"
          >
            <Plus className="size-3" aria-hidden="true" />
            Get more
          </Link>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-forest">
              {loading ? "…" : credits}
            </span>
            <span className="text-xs text-forest/60">/ {maxCredits} scans</span>
          </div>
          {isExhausted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              <AlertCircle className="size-3" />
              0 left
            </span>
          ) : isLow ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Low
            </span>
          ) : (
            <span className="text-[11px] font-medium text-forest/60">
              {percentage}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-forest/10"
          role="progressbar"
          aria-valuenow={credits}
          aria-valuemin={0}
          aria-valuemax={maxCredits}
          aria-label="Scan credit balance"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <Link
          href="/dashboard/credits"
          className="mt-0.5 flex items-center justify-center rounded-lg border border-forest/15 bg-sage/60 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-white"
        >
          Buy credits
        </Link>
      </div>

      {/* Collapsed / Medium screen compact view (icon + balance badge) */}
      <div className="flex flex-col items-center justify-center lg:group-data-[collapsed=false]/sidebar:hidden">
        <Link
          href="/dashboard/credits"
          title={`${credits} of ${maxCredits} credits available. Click to top up.`}
          className="group relative flex flex-col items-center justify-center rounded-xl border border-forest/10 bg-white/90 p-2 text-forest transition-all hover:border-forest/30 hover:bg-white hover:shadow-xs"
        >
          <Sparkles className={`size-5 ${isExhausted ? "text-red-500" : isLow ? "text-gold" : "text-leaf"}`} />
          <span className="mt-1 text-[11px] font-bold leading-none text-forest">
            {loading ? "…" : credits}
          </span>
          <span className="text-[9px] text-forest/60">left</span>
        </Link>
      </div>
    </div>
  );
}
