"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquare,
  ShieldQuestion,
  XCircle,
} from "lucide-react";
function formatReviewDate(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}
import type { ClearanceInfo } from "@/lib/api";

const REASON_LABELS: Record<string, string> = {
  insufficient_evidence: "The automatic read of this scan was not confident enough.",
  no_catalog_match: "This product could not be matched to the catalog.",
  user_request: "You asked a reviewer to look at this scan.",
};

export default function ClearanceRequest({
  scanId,
  clearance,
}: {
  scanId: string;
  clearance: ClearanceInfo | null;
}) {
  const [current, setCurrent] = useState<ClearanceInfo | null>(clearance);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestReview() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/scans/${scanId}/clearance`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        clearance?: ClearanceInfo;
        error?: string;
      };
      if (!response.ok || !data.clearance) {
        throw new Error(
          data.error ?? "Could not send this scan for review. Please try again."
        );
      }
      setCurrent(data.clearance);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not send this scan for review."
      );
    } finally {
      setBusy(false);
    }
  }

  const reviewTimestamp = formatReviewDate(current?.reviewedAt);

  // 1. Cleared / Approved: Final decision. No resubmission allowed.
  if (current?.status === "cleared") {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-green-700/20 bg-green-50/80 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-green-950">
                A reviewer cleared this scan
              </h2>
              {reviewTimestamp ? (
                <span className="text-xs text-green-800/70">
                  Reviewed on {reviewTimestamp}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-green-900/80">
              A Tracee reviewer examined this scan and verified the result. This review is finalized.
            </p>
          </div>
        </div>

        {current.adminNote ? (
          <div className="mt-1 rounded-xl border border-green-700/15 bg-white/70 p-3 text-xs leading-5 text-green-950">
            <div className="flex items-center gap-1.5 font-semibold text-green-900">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reviewer note</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-green-900/90">
              {current.adminNote}
            </p>
          </div>
        ) : null}

        <div className="mt-1 flex items-center justify-between border-t border-green-700/10 pt-3">
          <span className="text-xs text-green-900/70">
            Have a different package or batch?
          </span>
          <Link
            href="/dashboard/scan"
            className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 underline underline-offset-4 hover:text-green-950"
          >
            Start a new scan
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  // 2. Rejected: Final decision. No resubmission allowed.
  if (current?.status === "rejected") {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-red-700/20 bg-red-50/80 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <XCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-red-950">
                A reviewer rejected this scan
              </h2>
              {reviewTimestamp ? (
                <span className="text-xs text-red-800/70">
                  Reviewed on {reviewTimestamp}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-red-900/80">
              A Tracee reviewer examined this scan and determined it could not be cleared. This decision is final for this scan.
            </p>
          </div>
        </div>

        {current.adminNote ? (
          <div className="mt-1 rounded-xl border border-red-700/15 bg-white/70 p-3 text-xs leading-5 text-red-950">
            <div className="flex items-center gap-1.5 font-semibold text-red-900">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reviewer note</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-red-900/90">
              {current.adminNote}
            </p>
          </div>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-red-700/10 pt-3">
          <p className="text-xs text-red-900/70">
            If you have clearer photos, different angles, or another item, please scan again.
          </p>
          <Link
            href="/dashboard/scan"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800"
          >
            Start a new scan
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  // 3. Waiting / Pending
  if (current?.status === "pending") {
    return (
      <section
        className="flex items-start gap-3 rounded-2xl border border-amber-900/15 bg-amber-50 p-4 sm:p-5"
        role="status"
      >
        <Clock3
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-800"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-sm font-semibold text-amber-950">
            Waiting for a reviewer
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            This scan is currently in the admin review queue. You&apos;ll see the reviewer&apos;s decision and notes here once reviewed.
          </p>
        </div>
      </section>
    );
  }

  // 4. Needs Info or Fresh Request
  const needsInfo = current?.status === "needs_info";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-forest/10 bg-cream/65 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {needsInfo ? (
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
        ) : (
          <ShieldQuestion
            className="mt-0.5 h-5 w-5 shrink-0 text-forest"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-forest">
              {needsInfo
                ? "A reviewer requested more information"
                : "Not sure about this result?"}
            </h2>
            {needsInfo && reviewTimestamp ? (
              <span className="text-xs text-forest/50">
                Requested on {reviewTimestamp}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-forest/70">
            {needsInfo
              ? "The reviewer needs more details to verify this product. Please check the reviewer's note below, update the label text if needed, and resubmit for review."
              : "Send this scan to a Tracee reviewer for a manual check before you rely on it."}
          </p>
          {current && REASON_LABELS[current.reason] ? (
            <p className="mt-1 text-xs leading-5 text-forest/55">
              {REASON_LABELS[current.reason]}
            </p>
          ) : null}
        </div>
      </div>

      {needsInfo && current?.adminNote ? (
        <div className="rounded-xl border border-amber-900/15 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reviewer instructions</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-amber-950/90">
            {current.adminNote}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={requestReview}
          disabled={busy}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : needsInfo ? (
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ShieldQuestion className="h-4 w-4" aria-hidden="true" />
          )}
          {busy
            ? "Sending…"
            : needsInfo
              ? "Send updated info for review"
              : "Ask an admin to review"}
        </button>
      </div>

      {error ? (
        <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
