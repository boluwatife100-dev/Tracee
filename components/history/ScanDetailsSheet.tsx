"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import ProductAnalysis from "@/components/scan/ProductAnalysis";
import { fetchProductAnalysis, type ProductAnalysisResult } from "@/lib/api";

export default function ScanDetailsSheet({
  scanId,
  onClose,
}: {
  scanId: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<ProductAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    fetchProductAnalysis(scanId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load the scan details."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [scanId]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="scan-details-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-forest backdrop:bg-forest/35"
    >
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-forest/10 px-5 py-4 sm:px-7">
          <h2 id="scan-details-title" className="text-lg font-bold text-forest">
            Scan details
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close scan details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-forest/70 hover:bg-sage hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {loading ? (
            <div
              className="flex items-center justify-center py-16"
              role="status"
              aria-label="Loading scan details"
            >
              <LoaderCircle
                className="h-8 w-8 animate-spin text-forest/60"
                aria-hidden="true"
              />
            </div>
          ) : error ? (
            <p
              className="flex items-start gap-2 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : result ? (
            <ProductAnalysis result={result} embedded />
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
