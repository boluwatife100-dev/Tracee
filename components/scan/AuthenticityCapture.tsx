"use client";

import Image from "next/image";
import Link from "next/link";
import { useCredits, notifyCreditsUpdated } from "@/components/credits/CreditsContext";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  FileWarning,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  BrowserMultiFormatReader,
} from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import {
  compressImage,
  getContentHash,
  MAX_IMAGE_SIZE,
  PhotoField,
  uploadToCloudinary,
} from "@/components/scan/ScanCapture";
import {
  AUTHENTICITY_STATES,
  type AuthenticityState,
} from "@/lib/authenticity/scoring";

const DISCLAIMER =
  "Results are based on the NAFDAC database. This app is not a NAFDAC body and cannot confirm a product is genuine or fake. If in doubt, especially with drugs, confirm with NAFDAC or a pharmacist.";

type CheckResult = {
  id: string;
  state: AuthenticityState;
  status: string;
  reasons: string[];
  aiReview: AuthenticityAIReview | null;
  extractedFields: Record<string, unknown> | null;
  matchedRecord: Record<string, unknown> | null;
  frontImageUrl: string | null;
  registrySource: string | null;
  registryAvailable: boolean | null;
  nafdacRegNumber: string | null;
  barcodeValue: string | null;
  officialUrl: string;
  createdAt: string;
};

type HistoryItem = {
  id: string;
  state: AuthenticityState;
  status: string;
  nafdacRegNumber: string | null;
  extractedFields: Record<string, unknown> | null;
  matchedRecord: Record<string, unknown> | null;
  frontImageUrl: string | null;
  registryAvailable: boolean | null;
  registrySource: string | null;
  barcodeValue: string | null;
  officialUrl: string;
  reasons: string[];
  aiReview: AuthenticityAIReview | null;
  createdAt: string;
};

type AuthenticityAIReview = {
  summary: string;
  meaning: string;
  confidenceScore: number;
  confidenceExplanation: string;
  recommendedActions: string[];
};

async function fetchAuthenticityHistory(): Promise<HistoryItem[]> {
  const response = await fetch("/api/authenticity/history");
  const data = (await response.json()) as {
    checks?: HistoryItem[];
    error?: string;
  };
  if (!response.ok) throw new Error(data.error ?? "Unable to load check history.");
  return data.checks ?? [];
}

type UploadSlot = "front" | "back" | "barcode";
type CheckStatus = "idle" | "uploading" | "extracting" | "checking" | "complete";

const LABELS: Record<AuthenticityState, string> = {
  VERIFIED_REGISTRATION: "Registration details matched",
  MISMATCH: "Registration details differ",
  NOT_FOUND: "Registration number not found",
  INSUFFICIENT_EVIDENCE: "Could not be verified",
};

function safeRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readable(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "Not readable";
}

function stateStyle(state: AuthenticityState): string {
  if (state === "VERIFIED_REGISTRATION") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-700/20";
  }
  if (state === "MISMATCH") {
    return "bg-rose-50 text-rose-900 ring-1 ring-inset ring-rose-700/20";
  }
  if (state === "NOT_FOUND") {
    return "bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-700/20";
  }
  return "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-700/15";
}

function ResultCard({
  result,
  onViewDetails,
}: {
  result: CheckResult | HistoryItem;
  onViewDetails: () => void;
}) {
  const extraction = safeRecord(result.extractedFields);
  const matchedRecord = safeRecord(result.matchedRecord);
  const productName = readable(extraction?.productName ?? matchedRecord?.productName);

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-forest/10 bg-white p-3 sm:gap-4 sm:p-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sage/60 sm:h-24 sm:w-24">
        {result.frontImageUrl ? (
          <Image
            src={result.frontImageUrl}
            alt={`${productName} front of package`}
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-forest/45">
            <ImageIcon className="h-7 w-7" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <h3 className="line-clamp-2 font-semibold leading-5 text-forest">
          {productName}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${stateStyle(result.state)}`}
        >
          {LABELS[result.state]}
        </span>
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold text-forest underline decoration-forest/35 underline-offset-4 hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          View details
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function ResultDetailsSheet({
  result,
  onClose,
  onReport,
}: {
  result: CheckResult | HistoryItem;
  onClose: () => void;
  onReport?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="authenticity-details-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-forest backdrop:bg-forest/35"
    >
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-forest/10 px-5 py-4 sm:px-7">
          <h2
            id="authenticity-details-title"
            className="text-lg font-bold text-forest"
          >
            Product check details
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close product check details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-forest/70 hover:bg-sage hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <ResultDetails result={result} onReport={onReport} />
        </div>
      </div>
    </dialog>
  );
}

function ResultDetails({
  result,
  onReport,
}: {
  result: CheckResult | HistoryItem;
  onReport?: () => void;
}) {
  const extraction = safeRecord(result.extractedFields);
  const record = safeRecord("matchedRecord" in result ? result.matchedRecord : null);
  const reasons = Array.isArray(result.reasons)
    ? result.reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  const extractedConfidence = safeRecord(extraction?.confidence);
  const confidenceValues = extractedConfidence
    ? Object.values(extractedConfidence).filter(
        (value): value is number => typeof value === "number"
      )
    : [];
  const averageConfidence = confidenceValues.length
    ? Math.round(
        (confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length) *
          100
      )
    : 0;
  const stateIcon =
    result.state === "VERIFIED_REGISTRATION" ? (
      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
    ) : result.state === "INSUFFICIENT_EVIDENCE" ? (
      <FileWarning className="h-5 w-5" aria-hidden="true" />
    ) : (
      <TriangleAlert className="h-5 w-5" aria-hidden="true" />
    );

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-forest/55">
            Product consistency check
          </p>
          <h2 className="mt-1 text-xl font-bold text-forest">
            {readable(extraction?.productName)}
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${stateStyle(result.state)}`}
        >
          {stateIcon}
          {LABELS[result.state]}
        </span>
      </div>

      <ul className="flex flex-col gap-2 rounded-2xl bg-sage/50 p-4 text-sm leading-6 text-forest">
        {reasons.map((reason, index) => (
          <li key={`${index}-${reason}`} className="flex gap-2">
            <span aria-hidden="true">•</span>
            {reason}
          </li>
        ))}
      </ul>

      <section
        className="rounded-2xl border border-forest/10 bg-mint/35 p-4 sm:p-5"
        aria-labelledby={`ai-review-${result.id}`}
      >
        <h3
          id={`ai-review-${result.id}`}
          className="text-sm font-bold text-forest"
        >
          AI review
        </h3>
        {result.aiReview ? (
          <div className="mt-2 flex flex-col gap-3 text-sm leading-6 text-forest">
            <p className="font-semibold">{result.aiReview.summary}</p>
            <p>{result.aiReview.meaning}</p>
            <div>
              <p className="font-semibold">
                Confidence in this assessment: {result.aiReview.confidenceScore}%
              </p>
              <p>{result.aiReview.confidenceExplanation}</p>
            </div>
            {result.aiReview.recommendedActions.length ? (
              <div>
                <p className="font-semibold">What you can do</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {result.aiReview.recommendedActions.map((action, index) => (
                    <li key={`${index}-${action}`} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-forest/75">
            No AI review was saved for this check.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-forest/70">
          AI-generated guidance based on this check&apos;s findings. It does not
          confirm whether a product is genuine or fake. The confidence score
          describes confidence in this assessment, not product authenticity.
        </p>
      </section>

      <p className="text-xs text-forest/65">
        Label-reading confidence: {averageConfidence}% · NAFDAC data{" "}
        {"registryAvailable" in result && result.registryAvailable
          ? "available"
          : "registryAvailable" in result && result.registryAvailable === false
            ? "unavailable"
            : "not checked"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-forest/10 p-4">
            <h3 className="mb-3 text-sm font-bold text-forest">Read from package</h3>
            <dl className="flex flex-col gap-2 text-sm">
              {[
                { key: "nafdacRegNumber", label: "Registration number" },
                { key: "productName", label: "Product name" },
                { key: "brand", label: "Brand" },
                { key: "manufacturerImporter", label: "Manufacturer/importer" },
                { key: "category", label: "Category" },
                { key: "batchNumber", label: "Batch number" },
                { key: "mfgDate", label: "Manufactured" },
                { key: "expiryDate", label: "Expiry" },
                { key: "barcodeValue", label: "Barcode" },
              ].map(({ key, label }) => {
                const value =
                  key === "barcodeValue"
                    ? "barcodeValue" in result
                      ? result.barcodeValue
                      : null
                    : extraction?.[key];
                const confidence = extractedConfidence?.[key];
                return (
                  <div key={key} className="flex flex-col gap-0.5">
                    <dt className="text-xs font-medium text-forest/55">{label}</dt>
                    <dd className="break-words font-semibold text-forest">
                      {readable(value)}
                    </dd>
                    {typeof confidence === "number" ? (
                      <dd className="text-xs text-forest/55">
                        {key === "nafdacRegNumber" &&
                        extraction?.nafdacRegNumberManuallyEntered === true
                          ? "Entered by you"
                          : `${Math.round(confidence * 100)}% read confidence`}
                      </dd>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </section>
          <section className="rounded-2xl border border-forest/10 p-4">
            <h3 className="mb-3 text-sm font-bold text-forest">NAFDAC record</h3>
            {record ? (
              <dl className="flex flex-col gap-2 text-sm">
                {[
                  { label: "Registration number", value: record.registrationNumber },
                  { label: "Product name", value: record.productName },
                  { label: "Manufacturer/applicant", value: record.manufacturer },
                  { label: "Category", value: record.category },
                  { label: "Source", value: record.source },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-xs font-medium text-forest/55">{label}</dt>
                    <dd className="break-words font-semibold text-forest">
                      {readable(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm leading-6 text-forest/70">
                No comparable registry record was available for this check.
              </p>
            )}
          </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-forest/10 pt-4">
        <a
          href={result.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="w-fit text-sm font-semibold text-forest underline underline-offset-4"
        >
          Check the official NAFDAC registry
        </a>
        {onReport ? (
          <button
            type="button"
            onClick={onReport}
            className="min-h-11 w-full rounded-xl border border-forest/20 px-4 text-sm font-semibold text-forest hover:bg-sage sm:w-fit"
          >
            Report this product
          </button>
        ) : null}
        <p className="text-xs leading-5 text-forest/65">{DISCLAIMER}</p>
        <p className="text-xs text-forest/55">
          Checked {new Date(result.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="rounded-2xl border border-amber-900/10 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      {DISCLAIMER}
    </p>
  );
}

export default function AuthenticityCapture() {
  const [photos, setPhotos] = useState<Record<UploadSlot, File | null>>({
    front: null,
    back: null,
    barcode: null,
  });
  const [consent, setConsent] = useState(false);
  const [manualRegistrationNumber, setManualRegistrationNumber] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [activeDetails, setActiveDetails] = useState<CheckResult | HistoryItem | null>(
    null
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [reportPhoto, setReportPhoto] = useState<File | null>(null);
  const [reportError, setReportError] = useState("");
  const [reportSaved, setReportSaved] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const { credits, loading: creditsLoading } = useCredits();
  const isOutOfCredits = !creditsLoading && credits <= 0;
  const isLowCredits = !creditsLoading && credits > 0 && credits <= 2;


  async function refreshHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      setHistory(await fetchAuthenticityHistory());
    } catch (loadError) {
      setHistoryError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load check history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void fetchAuthenticityHistory()
      .then((checks) => {
        if (!cancelled) {
          setHistory(checks);
          setHistoryError("");
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setHistoryError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load check history."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setPhoto(slot: UploadSlot, file: File | null): boolean {
    setError("");
    setResult(null);
    if (file && file.type && !file.type.startsWith("image/")) {
      setError("Choose an image file.");
      setPhotos((current) => ({ ...current, [slot]: null }));
      return false;
    }
    if (file && file.size > MAX_IMAGE_SIZE) {
      setError("Choose an image no larger than 25 MB.");
      setPhotos((current) => ({ ...current, [slot]: null }));
      return false;
    }
    setPhotos((current) => ({ ...current, [slot]: file }));
    return true;
  }

  async function readBarcode(files: File[]): Promise<string | null> {
    const reader = new BrowserMultiFormatReader();
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const decoded = await reader.decodeFromImageUrl(url);
        return decoded.getText() || null;
      } catch (decodeError) {
        if (!(decodeError instanceof NotFoundException)) {
          console.warn("Barcode was not readable from one product photo.", decodeError);
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    return null;
  }

  async function readLabel(file: File): Promise<{ text: string; confidence: number }> {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (message) => {
        if (message.status === "recognizing text") {
          setOcrProgress(Math.round(message.progress * 100));
        }
      },
    });
    try {
      const recognized = await worker.recognize(file);
      return {
        text: recognized.data.text,
        confidence: Math.round(recognized.data.confidence),
      };
    } finally {
      await worker.terminate();
    }
  }

  async function handleSubmit() {
    const selected = (Object.entries(photos) as [UploadSlot, File | null][])
      .filter((entry): entry is [UploadSlot, File] => entry[1] !== null);
    if (!selected.length || !consent || status !== "idle") return;
    setError("");
    setResult(null);
    setStatus("uploading");

    if (isOutOfCredits) {
      setError("You have used all your credits. Please visit the Credits page to purchase more.");
      return;
    }

    try {
      const uploaded = await Promise.all(
        selected.map(async ([slot, file]) => {
          const compressed = await compressImage(file);
          const contentHash = await getContentHash(compressed);
          return {
            slot,
            contentHash,
            publicId: await uploadToCloudinary(compressed, contentHash),
          };
        })
      );
      const photoPublicIds = Object.fromEntries(
        uploaded.map(({ slot, publicId }) => [slot, publicId])
      );
      const photoContentHashes = Object.fromEntries(
        uploaded.map(({ slot, contentHash }) => [slot, contentHash])
      );

      setStatus("extracting");
      setOcrProgress(0);
      let ocrText = "";
      let ocrConfidence: number | null = null;
      const labelPhoto = photos.back ?? photos.front ?? photos.barcode;
      if (labelPhoto) {
        try {
          const ocr = await readLabel(labelPhoto);
          ocrText = ocr.text;
          ocrConfidence = ocr.confidence;
        } catch (ocrError) {
          console.warn("Local OCR could not read the product registration number.", ocrError);
        }
      }
      const barcodeValue = await readBarcode(
        selected.map(([, file]) => file)
      );
      setStatus("checking");

      const response = await fetch("/api/authenticity/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaConsent: true,
          photoPublicIds,
          photoContentHashes,
          ocrText,
          ocrConfidence,
          barcodeValue,
          manualRegistrationNumber,
        }),
      });
      let data = (await response.json()) as CheckResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not complete this check.");
      if (data.status !== "completed") {
        for (let attempt = 0; attempt < 145; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2_000));
          const statusResponse = await fetch(`/api/authenticity/check/${data.id}`);
          const statusData = (await statusResponse.json()) as CheckResult & {
            error?: string;
          };
          if (!statusResponse.ok) {
            throw new Error(statusData.error ?? "Could not retrieve the check result.");
          }
          data = statusData;
          if (data.status === "review_failed") {
            throw new Error(
              (statusData as CheckResult & { error?: string }).error ??
                "The AI review could not be completed. Please try the check again."
            );
          }
          if (data.status === "completed") break;
        }
      }
      if (data.status !== "completed") {
        throw new Error("The check is taking longer than expected. Please check history shortly.");
      }
      if (!AUTHENTICITY_STATES.includes(data.state)) {
        throw new Error("The authenticity check returned an unexpected result.");
      }
      setResult(data);
      setStatus("complete");
      notifyCreditsUpdated();
      await refreshHistory().catch((historyError: unknown) => {
        setError(
          historyError instanceof Error
            ? historyError.message
            : "The result was saved, but history could not be refreshed."
        );
      });
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The check could not be completed. Please try again."
      );
    }
  }

  async function handleReport() {
    if (!result || reportNote.trim().length < 5) {
      setReportError("Describe what concerns you in at least five characters.");
      return;
    }
    setReportError("");
    try {
      let extraPhotoId: string | null = null;
      if (reportPhoto) {
        const compressed = await compressImage(reportPhoto);
        const hash = await getContentHash(compressed);
        extraPhotoId = await uploadToCloudinary(compressed, hash);
      }
      const response = await fetch("/api/authenticity/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkId: result.id,
          note: reportNote,
          extraPhotoId,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save this report.");
      setReportSaved(true);
      setReportOpen(false);
    } catch (caughtError) {
      setReportError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save this report."
      );
    }
  }

  const busy = status === "uploading" || status === "extracting" || status === "checking";
  const statusLabel =
    status === "uploading"
      ? "Uploading your photos…"
      : status === "extracting"
        ? `Reading the package${ocrProgress ? ` · ${ocrProgress}%` : ""}…`
        : status === "checking"
          ? "Checking NAFDAC and preparing the AI review…"
          : "Check product registration";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <header className="flex flex-col gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-forest">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">
          Authenticity Check
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-forest/70">
          Compare the label details and registration number with available NAFDAC records.
          This consistency check cannot prove whether a product is genuine or fake.
        </p>
      </header>

      <Disclaimer />

      {isOutOfCredits && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">You&apos;re out of scan credits (0 remaining)</p>
              <p className="text-xs text-red-700 mt-0.5">
                Each authenticity check requires 1 credit. Please visit the Credits page to purchase more.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/credits"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 shrink-0"
          >
            Get Credits
          </Link>
        </div>
      )}

      {isLowCredits && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-700" />
            <span>
              <strong>{credits} {credits === 1 ? "credit" : "credits"} remaining</strong> on your account.
            </span>
          </div>
          <Link
            href="/dashboard/credits"
            className="font-semibold text-amber-900 underline underline-offset-2 hover:text-black"
          >
            View Refills &rarr;
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <PhotoField
          id="authenticity-front"
          label="Front of package"
          file={photos.front}
          onSelect={(file) => setPhoto("front", file)}
        />
        <PhotoField
          id="authenticity-back"
          label="Back / registration label"
          file={photos.back}
          onSelect={(file) => setPhoto("back", file)}
        />
        <PhotoField
          id="authenticity-barcode"
          label="Barcode area (optional)"
          file={photos.barcode}
          onSelect={(file) => setPhoto("barcode", file)}
        />
      </div>
      <p className="-mt-4 text-xs leading-5 text-forest/60">
        Include a sharp close-up of the NAFDAC number, product name, manufacturer, batch,
        and dates. The barcode is read separately from printed text.
      </p>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="manual-nafdac-number"
          className="text-sm font-semibold text-forest"
        >
          NAFDAC number <span className="font-normal text-forest/60">(optional)</span>
        </label>
        <input
          id="manual-nafdac-number"
          type="text"
          value={manualRegistrationNumber}
          onChange={(event) => {
            setManualRegistrationNumber(event.target.value);
            setResult(null);
          }}
          maxLength={80}
          autoComplete="off"
          aria-describedby="manual-nafdac-number-hint"
          placeholder="For example, A8-102316L"
          className="min-h-12 w-full rounded-xl border border-forest/20 bg-white px-4 text-sm text-forest placeholder:text-forest/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:max-w-md"
        />
        <p
          id="manual-nafdac-number-hint"
          className="text-xs leading-5 text-forest/65"
        >
          If the number is hard to read in your photo, enter it exactly as seen
          on the product. We&apos;ll use this number for the registry check.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t border-forest/10 pt-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-forest/75">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          />
          <span>Consent to saving the image in our cloud storage.</span>
        </label>
        <button
          type="button"
          disabled={!Object.values(photos).some(Boolean) || !consent || busy || isOutOfCredits}
          onClick={handleSubmit}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:bg-forest/35 sm:w-auto sm:self-start"
        >
          {busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {statusLabel}
        </button>
        {error ? (
          <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="flex flex-col gap-4">
          <ResultCard
            result={result}
            onViewDetails={() => setActiveDetails(result)}
          />
          {reportSaved ? (
            <p className="text-sm font-semibold text-emerald-800" role="status">
              Your report has been saved. Thank you for helping improve product safety.
            </p>
          ) : null}
          {reportOpen ? (
            <section className="flex flex-col gap-4 rounded-2xl border border-forest/10 bg-white p-5">
              <h3 className="text-lg font-bold text-forest">Report this product</h3>
              <label className="flex flex-col gap-2 text-sm font-semibold text-forest">
                What concerns you about this product?
                <textarea
                  value={reportNote}
                  onChange={(event) => setReportNote(event.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="min-h-24 rounded-lg border border-forest/15 bg-white p-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-forest">
                Add another photo (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setReportPhoto(event.target.files?.[0] ?? null)}
                  className="text-sm font-normal"
                />
              </label>
              {reportError ? (
                <p className="text-sm text-red-700" role="alert">{reportError}</p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReport}
                  className="min-h-11 rounded-xl bg-forest px-5 text-sm font-semibold text-white"
                >
                  Submit report
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="min-h-11 rounded-xl border border-forest/20 px-5 text-sm font-semibold text-forest"
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-forest">Recent checks</h2>
          <p className="mt-1 text-sm text-forest/65">Your saved product checks</p>
        </div>
        {historyLoading ? (
          <div
            className="flex flex-col gap-3"
            role="status"
            aria-label="Loading recent checks"
            aria-busy="true"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                aria-hidden="true"
                className="flex items-center gap-4 rounded-2xl border border-forest/10 bg-white p-3 sm:p-4"
              >
                <span className="h-20 w-20 shrink-0 rounded-xl bg-sage/60 sm:h-24 sm:w-24" />
                <span className="flex flex-1 flex-col items-start gap-3">
                  <span className="h-4 w-2/3 rounded bg-sage/70" />
                  <span className="h-6 w-40 max-w-full rounded-full bg-sage/70" />
                  <span className="h-4 w-24 rounded bg-sage/70" />
                </span>
              </div>
            ))}
            <span className="sr-only">Loading your saved product checks…</span>
          </div>
        ) : historyError ? (
          <div
            className="flex flex-col items-start gap-3 rounded-2xl border border-rose-900/15 bg-rose-50 p-5 text-sm text-rose-950"
            role="alert"
          >
            <p>{historyError}</p>
            <button
              type="button"
              onClick={() => void refreshHistory()}
              className="min-h-10 rounded-lg border border-rose-900/20 px-4 font-semibold text-rose-950 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
            >
              Try again
            </button>
          </div>
        ) : history.length ? (
          <div className="flex flex-col gap-4">
            {history.slice(0, 5).map((item) => (
              <ResultCard
                key={item.id}
                result={item}
                onViewDetails={() => setActiveDetails(item)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-forest/20 p-6 text-sm text-forest/65">
            No authenticity checks yet. Your completed checks will appear here.
          </div>
        )}
      </section>
      {activeDetails ? (
        <ResultDetailsSheet
          result={activeDetails}
          onClose={() => setActiveDetails(null)}
          onReport={
            "id" in activeDetails && result?.id === activeDetails.id
              ? () => {
                  setActiveDetails(null);
                  setReportError("");
                  setReportOpen(true);
                }
              : undefined
          }
        />
      ) : null}
    </section>
  );
}
