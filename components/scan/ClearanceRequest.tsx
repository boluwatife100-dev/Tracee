"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, ShieldQuestion } from "lucide-react";
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

  // A decision has been made: report it plainly instead of offering another request.
  if (current?.status === "cleared") {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-green-700/20 bg-green-50 p-4 sm:p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-green-900">
            A reviewer cleared this scan
          </h2>
          <p className="mt-1 text-sm leading-6 text-green-900/80">
            A Tracee reviewer checked this result and approved it.
          </p>
        </div>
      </section>
    );
  }

  if (current?.status === "pending") {
    return (
      <section
        className="flex items-start gap-3 rounded-2xl border border-amber-900/15 bg-amber-50 p-4 sm:p-5"
        role="status"
      >
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-amber-950">
            Waiting for a reviewer
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            This scan is in the admin review queue. We&apos;ll update it once a
            reviewer has looked at it.
          </p>
        </div>
      </section>
    );
  }

  const isRejected = current?.status === "rejected";
  const needsInfo = current?.status === "needs_info";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-forest/10 bg-cream/65 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-forest">
            {isRejected
              ? "A reviewer rejected the last request"
              : needsInfo
                ? "A reviewer needs more information"
                : "Not sure about this result?"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-forest/70">
            {isRejected
              ? "You can ask a Tracee reviewer to take another look."
              : needsInfo
                ? "Update the label text if you can, then send it back for review."
                : "Send this scan to a Tracee reviewer for a manual check before you rely on it."}
          </p>
          {current && REASON_LABELS[current.reason] ? (
            <p className="mt-1 text-xs leading-5 text-forest/55">
              {REASON_LABELS[current.reason]}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={requestReview}
        disabled={busy}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShieldQuestion className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Sending…" : "Ask an admin to review"}
      </button>
      {error ? (
        <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
