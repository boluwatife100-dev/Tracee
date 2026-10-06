"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  LoaderCircle,
  ScanLine,
  Sprout,
} from "lucide-react";

type ScanMode = "product" | "plant";
type ScanStatus = "idle" | "reading" | "uploading" | "complete";

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

function PhotoField({
  id,
  label,
  file,
  onSelect,
}: {
  id: string;
  label: string;
  file: File | null;
  onSelect: (file: File | null) => boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  function handleFileChange(nextFile: File | null) {
    if (!onSelect(nextFile)) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-forest">{label}</span>
      <label
        htmlFor={id}
        className="group relative flex aspect-4/3 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-forest/25 bg-cream text-center transition-colors hover:border-forest/50 hover:bg-sage/50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${label} photo preview`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-3 px-4 text-forest/70">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-forest">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">Take photo or choose file</span>
            <span className="text-xs">JPG, PNG, or WEBP up to 15 MB</span>
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            handleFileChange(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </label>
      {file ? (
        <span className="truncate text-xs text-forest/60">{file.name}</span>
      ) : null}
    </div>
  );
}

async function uploadToCloudinary(file: File): Promise<string> {
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
  });
  const signatureData = (await signatureResponse.json()) as {
    apiKey?: string;
    cloudName?: string;
    folder?: string;
    publicId?: string;
    signature?: string;
    timestamp?: number;
    type?: string;
    error?: string;
  };

  if (
    !signatureResponse.ok ||
    !signatureData.apiKey ||
    !signatureData.cloudName ||
    !signatureData.publicId
  ) {
    throw new Error(signatureData.error ?? "Could not authorize photo upload.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("folder", signatureData.folder ?? "");
  formData.append("public_id", signatureData.publicId);
  formData.append("type", signatureData.type ?? "authenticated");
  formData.append("signature", signatureData.signature ?? "");

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  const uploadData = (await uploadResponse.json()) as {
    public_id?: string;
    error?: { message?: string };
  };

  if (!uploadResponse.ok || !uploadData.public_id) {
    throw new Error(uploadData.error?.message ?? "Photo upload failed.");
  }

  return uploadData.public_id;
}

export default function ScanCapture() {
  const [mode, setMode] = useState<ScanMode>("product");
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const [mediaConsent, setMediaConsent] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [correctionSaved, setCorrectionSaved] = useState(false);

  const isBusy = status === "reading" || status === "uploading";
  const requiredPhotos = mode === "product" ? [frontPhoto, backPhoto] : [frontPhoto];
  const canSubmit = requiredPhotos.every(Boolean) && mediaConsent && !isBusy;

  function updatePhoto(
    setPhoto: (file: File | null) => void,
    file: File | null
  ): boolean {
    setError("");
    setStatus("idle");
    setOcrText("");
    setOcrConfidence(null);

    if (file && !file.type.startsWith("image/")) {
      setError("Choose an image file.");
      setPhoto(null);
      return false;
    }
    if (file && file.size > MAX_IMAGE_SIZE) {
      setError("Choose an image smaller than 15 MB.");
      setPhoto(null);
      return false;
    }
    setPhoto(file);
    return true;
  }

  async function handleSubmit() {
    if (!frontPhoto || (mode === "product" && !backPhoto)) return;

    let recognizedText = "";
    let recognizedConfidence: number | null = null;
    setError("");
    setOcrText("");
    setOcrConfidence(null);

    try {
      if (mode === "product" && backPhoto) {
        setStatus("reading");
        setOcrProgress(0);
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng", 1, {
          logger: (message) => {
            if (message.status === "recognizing text") {
              setOcrProgress(Math.round(message.progress * 100));
            }
          },
        });

        try {
          const result = await worker.recognize(backPhoto);
          recognizedText = result.data.text.trim();
          recognizedConfidence = Math.round(result.data.confidence);
          setOcrText(recognizedText);
          setOcrConfidence(recognizedConfidence);
        } finally {
          await worker.terminate();
        }
      }

      setStatus("uploading");
      const photoPublicIds = await Promise.all(
        [frontPhoto, mode === "product" ? backPhoto : null]
          .filter((file): file is File => file !== null)
          .map(uploadToCloudinary)
      );

      const scanResponse = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: mode,
          mediaConsent: true,
          photoPublicIds: {
            front: photoPublicIds[0],
            ...(mode === "product" ? { back: photoPublicIds[1] } : {}),
          },
          ocrText: recognizedText,
          ocrConfidence: recognizedConfidence,
        }),
      });
      const scanData = (await scanResponse.json()) as {
        error?: string;
        scanId?: string;
      };
      if (!scanResponse.ok) {
        throw new Error(scanData.error ?? "Could not save this scan.");
      }
      setScanId(scanData.scanId ?? null);
      setStatus("complete");
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The scan could not be completed. Try again."
      );
    }
  }

  async function saveCorrection() {
    if (!scanId) return;
    setError("");
    setCorrectionSaved(false);

    try {
      const response = await fetch(`/api/scans/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save the corrected label text.");
      }
      setCorrectionSaved(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save the corrected label text."
      );
    }
  }

  function changeMode(nextMode: ScanMode) {
    setMode(nextMode);
    setStatus("idle");
    setError("");
    setOcrText("");
    setOcrConfidence(null);
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <div>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">New scan</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-forest/70">
          Capture the package label or a plant photo.
        </p>
      </div>

      <div
        className="grid grid-cols-2 border-b border-forest/15"
        role="tablist"
        aria-label="Scan type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "product"}
          onClick={() => changeMode("product")}
          className={`inline-flex min-h-12 items-center justify-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
            mode === "product"
              ? "border-forest text-forest"
              : "border-transparent text-forest/55 hover:text-forest"
          }`}
        >
          <ScanLine className="h-4 w-4" aria-hidden="true" />
          Product
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "plant"}
          onClick={() => changeMode("plant")}
          className={`inline-flex min-h-12 items-center justify-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
            mode === "plant"
              ? "border-forest text-forest"
              : "border-transparent text-forest/55 hover:text-forest"
          }`}
        >
          <Sprout className="h-4 w-4" aria-hidden="true" />
          Plant
        </button>
      </div>

      <div className={`grid gap-5 ${mode === "product" ? "sm:grid-cols-2" : ""}`}>
        <PhotoField
          id="scan-front-photo"
          label={mode === "product" ? "Front of package" : "Plant photo"}
          file={frontPhoto}
          onSelect={(file) => updatePhoto(setFrontPhoto, file)}
        />
        {mode === "product" ? (
          <PhotoField
            id="scan-back-photo"
            label="Ingredients and details"
            file={backPhoto}
            onSelect={(file) => updatePhoto(setBackPhoto, file)}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 border-t border-forest/10 pt-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-forest/75">
          <input
            type="checkbox"
            checked={mediaConsent}
            onChange={(event) => setMediaConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          />
          <span>
            Consent to saving the image in our cloud storage.
          </span>
        </label>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:bg-forest/35 sm:w-auto sm:self-start"
        >
          {isBusy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : status === "complete" ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : null}
          {status === "reading"
            ? `Reading label ${ocrProgress}%`
            : status === "uploading"
              ? "Uploading photos…"
              : status === "complete"
                ? "Photos stored"
                : mode === "product"
                  ? "Read label and store photos"
                  : "Store plant photo"}
        </button>

        {error ? (
          <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {status === "complete" ? (
          <div className="flex flex-col gap-3 rounded-xl bg-sage/70 p-4" aria-live="polite">
            <p className="text-sm font-semibold text-forest">
              {mode === "product"
                ? "Label text extracted. No catalog verdict is available yet."
                : "Photo stored. Plant diagnosis is not connected yet."}
            </p>
            {mode === "product" ? (
              <>
                <p className="text-xs text-forest/70">
                  OCR confidence: {ocrConfidence ?? 0}%
                </p>
                <textarea
                  value={ocrText}
                  onChange={(event) => {
                    setOcrText(event.target.value);
                    setCorrectionSaved(false);
                  }}
                  aria-label="Extracted label text"
                  placeholder="No readable text found. You can enter it here."
                  rows={7}
                  className="w-full resize-y rounded-lg border border-forest/20 bg-white p-3 text-sm leading-6 text-forest outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={saveCorrection}
                    className="min-h-10 rounded-lg border border-forest/25 px-3 text-sm font-semibold text-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                  >
                    Save correction
                  </button>
                  {correctionSaved ? (
                    <span className="text-xs font-medium text-green-800" role="status">
                      Correction saved
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-5 text-forest/70">
                  GMO likelihood cannot be proven from a photo. No GMO or fluoride verdict is shown until the catalog is connected.
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}