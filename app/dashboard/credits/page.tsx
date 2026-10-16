"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Sprout,
  ScanLine,
  ArrowRight,
  Clock,
  Bell,
  Check,
} from "lucide-react";
import { useCredits } from "@/components/credits/CreditsContext";

const PACKAGES = [
  {
    id: "refill",
    name: "Starter Refill",
    scans: 15,
    tagline: "Great for light everyday label checking.",
    popular: false,
    features: [
      "15 AI-assisted scans",
      "Product, plant & authenticity scans",
      "No expiration date",
      "Priority allergen alerts",
    ],
  },
  {
    id: "explorer",
    name: "Explorer Pack",
    scans: 45,
    tagline: "Best value for active shoppers & plant parents.",
    popular: true,
    features: [
      "45 AI-assisted scans",
      "All scan types included",
      "No expiration date",
      "Comprehensive plant care schedules",
      "NAFDAC registry cross-checks",
    ],
  },
  {
    id: "pro",
    name: "Power Explorer",
    scans: 120,
    tagline: "For households and frequent plant caretakers.",
    popular: false,
    features: [
      "120 AI-assisted scans",
      "All scan types included",
      "Never expires",
      "Batch family allergen alerts",
      "Early access to new scan features",
    ],
  },
];

const FAQS = [
  {
    question: "When are credits deducted?",
    answer:
      "A credit is only deducted after your scan result has been successfully generated. If an image is unreadable, a scan fails, or an AI review cannot complete, zero credits are deducted.",
  },
  {
    question: "Which scans consume credits?",
    answer:
      "Every successful Product Analysis, Plant Health Diagnosis, and NAFDAC Authenticity Check consumes exactly 1 credit.",
  },
  {
    question: "Do my credits expire?",
    answer:
      "No. Your starting 10 free credits and any future purchased credits remain in your account until you use them.",
  },
];

export default function CreditsPage() {
  const { credits, maxCredits, loading } = useCredits();
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest">
          <Sparkles className="size-3.5 text-leaf" aria-hidden="true" />
          Scan Credit System
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-forest sm:text-3xl">
          Credits & Refills
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-forest/75">
          Tracee uses credits for AI-powered product insights, plant health diagnostics,
          and NAFDAC authenticity checks. Each account starts with 10 free scans.
        </p>
      </div>

      <section
        aria-labelledby="balance-heading"
        className="relative overflow-hidden rounded-2xl border border-forest/10 bg-sage/35 p-6 md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="balance-heading" className="text-xs font-semibold tracking-wider text-forest/70 uppercase">
              Current Balance
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
                {loading ? "…" : credits}
              </span>
              <span className="text-base font-medium text-forest/60">
                / {maxCredits} scans remaining
              </span>
            </div>
            <p className="text-xs text-forest/70">
              {isExhausted
                ? "You have used all your free scans. Direct card purchases will be enabled shortly."
                : isLow
                  ? "Your credit balance is running low. Make every scan count!"
                  : "You are all set to scan product labels, diagnose plants, and verify authenticity."}
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-56">
            <div className="flex items-center justify-between text-xs font-semibold text-forest">
              <span>Allowance used</span>
              <span>{100 - percentage}%</span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-forest/15"
              role="progressbar"
              aria-valuenow={credits}
              aria-valuemin={0}
              aria-valuemax={maxCredits}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-forest/60">
              <span>0 scans</span>
              <span>{maxCredits} scans</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-forest/10 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/70 px-3 py-2 text-xs text-forest">
            <ScanLine className="size-4 shrink-0 text-leaf" />
            <span>
              <strong>Product scan:</strong> 1 credit
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-white/70 px-3 py-2 text-xs text-forest">
            <Sprout className="size-4 shrink-0 text-leaf" />
            <span>
              <strong>Plant diagnosis:</strong> 1 credit
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-white/70 px-3 py-2 text-xs text-forest">
            <ShieldCheck className="size-4 shrink-0 text-leaf" />
            <span>
              <strong>Authenticity check:</strong> 1 credit
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="purchase-heading" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-amber-900">
              <Clock className="size-3.5" aria-hidden="true" />
              Purchase feature coming soon
            </div>
            <h2 id="purchase-heading" className="mt-2 text-xl font-bold text-forest sm:text-2xl">
              Credit Top-up Packs
            </h2>
            <p className="mt-1 text-sm text-forest/70">
              Payment gateway integration is currently in progress. Preview our upcoming bundles below.
            </p>
          </div>

          {!waitlistSubmitted ? (
            <button
              type="button"
              onClick={() => setWaitlistSubmitted(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-forest-dark sm:self-end"
            >
              <Bell className="size-3.5" aria-hidden="true" />
              Notify me when live
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-leaf/20 px-4 py-2.5 text-xs font-semibold text-forest">
              <Check className="size-4 text-leaf" aria-hidden="true" />
              You will be notified!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 transition-shadow ${
                pkg.popular
                  ? "border-leaf shadow-md ring-1 ring-leaf/30"
                  : "border-forest/15 shadow-xs"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 right-6 rounded-full bg-leaf px-3 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-forest">{pkg.name}</h3>
                  <span className="rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-bold text-forest">
                    {pkg.scans} scans
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-forest/70">{pkg.tagline}</p>

                <div className="mt-6 flex flex-col gap-2.5 border-t border-forest/10 pt-4">
                  {pkg.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-xs text-forest/85">
                      <CheckCircle2 className="size-3.5 shrink-0 text-leaf mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-forest/10 pt-4">
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-forest/20 bg-forest/5 py-2.5 text-center text-xs font-semibold text-forest/60"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="faqs-heading" className="rounded-2xl border border-forest/10 bg-white p-6 sm:p-8">
        <h2 id="faqs-heading" className="text-lg font-bold text-forest">
          Frequently Asked Questions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          {FAQS.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold text-forest">{faq.question}</h3>
              <p className="text-xs leading-5 text-forest/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-forest/10 pt-6">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-forest/70 hover:text-forest underline underline-offset-4"
        >
          &larr; Back to Dashboard
        </Link>
        <Link
          href="/dashboard/scan"
          className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-dark"
        >
          Start a new scan
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>

  );
}
