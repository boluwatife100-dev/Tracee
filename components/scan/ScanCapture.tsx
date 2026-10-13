"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Camera,
  LoaderCircle,
  ScanLine,
  Sprout,
} from "lucide-react";

type ScanMode = "product" | "plant";
type ScanStatus = "idle" | "reading" | "uploading" | "analyzing";

export const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_SIZE = 3 * 1024 * 1024;
const TARGET_COMPRESSED_IMAGE_SIZE = 1 * 1024 * 1024;

type Drawable = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function loadDrawable(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Some mobile browsers cannot decode certain formats (e.g. HEIC) via
      // createImageBitmap; fall back to an <img> element below.
    }
  }

  const url = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.src = url;
  try {
    if (typeof image.decode === "function") {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("decode failed"));
      });
    }
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This photo format is not supported. Try a JPG or PNG.");
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

export async function compressImage(file: File): Promise<File> {
  const { source, width, height, release } = await loadDrawable(file);
  try {
    let scale = Math.min(1, 2560 / Math.max(width, height));
    while (true) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare this photo for upload.");

      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);

      for (let quality = 0.86; quality >= 0.5; quality -= 0.12) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality)
        );
        if (!blob) throw new Error("Could not prepare this photo for upload.");
        if (blob.size <= TARGET_COMPRESSED_IMAGE_SIZE) {
          const baseName = file.name.replace(/\.[^.]+$/, "") || "scan-photo";
          return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });
        }
      }

      if (Math.max(canvas.width, canvas.height) <= 320) {
        throw new Error("This photo could not be optimized for upload.");
      }
      scale *= 0.8;
    }
  } finally {
    release();
  }
}

export async function getContentHash(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Photo uploads require a secure (HTTPS) connection. Please reload over HTTPS."
    );
  }
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function PhotoField({
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
            <span className="text-xs">JPG, PNG, or WEBP up to 25 MB</span>
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
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

export async function uploadToCloudinary(
  file: File,
  contentHash: string
): Promise<string> {
  if (file.size > MAX_UPLOAD_IMAGE_SIZE) {
    throw new Error("The prepared photo is larger than the 3 MB upload limit.");
  }
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentHash }),
  });
  const signatureData = (await signatureResponse.json()) as {
    apiKey?: string;
    cloudName?: string;
    folder?: string;
    publicId?: string;
    signature?: string;
    timestamp?: number;
    type?: string;
    reused?: boolean;
    error?: string;
  };

  if (
    signatureResponse.ok &&
    signatureData.reused &&
    signatureData.publicId
  ) {
    return signatureData.publicId;
  }

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

export default function ScanCapture({
  initialMode = "product",
}: {
  initialMode?: ScanMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ScanMode>(initialMode);
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [wholePlantPhoto, setWholePlantPhoto] = useState<File | null>(null);
  const [closeUpPhoto, setCloseUpPhoto] = useState<File | null>(null);
  const [undersidePhoto, setUndersidePhoto] = useState<File | null>(null);
  const [watering, setWatering] = useState("");
  const [light, setLight] = useState("");
  const [plantName, setPlantName] = useState("");
  const [leafDescription, setLeafDescription] = useState("");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const [mediaConsent, setMediaConsent] = useState(false);
  const isBusy =
    status === "reading" || status === "uploading" || status === "analyzing";
  const canSubmit =
    (mode === "product"
      ? Boolean(frontPhoto && backPhoto)
      : Boolean(wholePlantPhoto && closeUpPhoto && watering && light)) &&
    mediaConsent &&
    !isBusy;

  function updatePhoto(
    setPhoto: (file: File | null) => void,
    file: File | null
  ): boolean {
    setError("");
    setStatus("idle");

    if (file && file.type && !file.type.startsWith("image/")) {
      setError("Choose an image file.");
      setPhoto(null);
      return false;
    }
    if (file && file.size > MAX_IMAGE_SIZE) {
      setError("Choose an image no larger than 25 MB.");
      setPhoto(null);
      return false;
    }
    setPhoto(file);
    return true;
  }

  async function handleSubmit() {
    if (
      (mode === "product" && (!frontPhoto || !backPhoto)) ||
      (mode === "plant" && (!wholePlantPhoto || !closeUpPhoto || !watering || !light))
    ) {
      return;
    }

    let recognizedText = "";
    let recognizedConfidence: number | null = null;
    setError("");

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
        } finally {
          await worker.terminate();
        }
      }

      setStatus("uploading");
      const photos: { key: string; file: File }[] =
        mode === "product"
          ? [
              ...(frontPhoto ? [{ key: "front", file: frontPhoto }] : []),
              ...(backPhoto ? [{ key: "back", file: backPhoto }] : []),
            ]
          : [
              ...(wholePlantPhoto ? [{ key: "whole", file: wholePlantPhoto }] : []),
              ...(closeUpPhoto ? [{ key: "closeUp", file: closeUpPhoto }] : []),
              ...(undersidePhoto
                ? [{ key: "underside", file: undersidePhoto }]
                : []),
            ];
      const uploadsByHash = new Map<string, Promise<string>>();
      const uploadedPhotos = await Promise.all(
        photos.map(async ({ key, file }) => {
          const compressedFile = await compressImage(file);
          const contentHash = await getContentHash(compressedFile);
          let upload = uploadsByHash.get(contentHash);
          if (!upload) {
            upload = uploadToCloudinary(compressedFile, contentHash);
            uploadsByHash.set(contentHash, upload);
          }
          return { key, contentHash, publicId: await upload };
        })
      );
      const photoPublicIds = Object.fromEntries(
        uploadedPhotos.map(({ key, publicId }) => [key, publicId])
      );
      const photoContentHashes = Object.fromEntries(
        uploadedPhotos.map(({ key, contentHash }) => [key, contentHash])
      );

      const scanResponse = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: mode,
          mediaConsent: true,
          photoPublicIds,
          photoContentHashes,
          ...(mode === "plant"
            ? {
                plantContext: {
                  watering,
                  light,
                  ...(plantName.trim() ? { name: plantName.trim() } : {}),
                  ...(leafDescription.trim()
                    ? { leafDescription: leafDescription.trim() }
                    : {}),
                },
              }
            : {}),
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
      const savedScanId = scanData.scanId;
      if (!savedScanId) throw new Error("The saved scan did not return an ID.");
      if (mode === "plant") {
        setStatus("analyzing");
        const diagnosisResponse = await fetch(
          `/api/scans/${savedScanId}/diagnosis`,
          { method: "POST" }
        );
        const diagnosisData = (await diagnosisResponse.json()) as {
          error?: string;
        };
        if (!diagnosisResponse.ok) {
          throw new Error(diagnosisData.error ?? "Could not analyze this plant.");
        }
        router.push(`/dashboard/my-plant/${savedScanId}`);
        return;
      }
      setStatus("analyzing");
      router.push(`/dashboard/scan/product-result?id=${savedScanId}`);
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The scan could not be completed. Try again."
      );
    }
  }

  function changeMode(nextMode: ScanMode) {
    setMode(nextMode);
    router.replace(`/dashboard/scan?type=${nextMode}`, { scroll: false });
    setStatus("idle");
    setError("");
    setWholePlantPhoto(null);
    setCloseUpPhoto(null);
    setUndersidePhoto(null);
    setWatering("");
    setLight("");
    setPlantName("");
    setLeafDescription("");
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <div>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">New scan</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-forest/70">
          Capture a product label or give us the views and context we need to assess a plant.
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

      {mode === "product" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <PhotoField
            id="scan-front-photo"
            label="Front of package"
            file={frontPhoto}
            onSelect={(file) => updatePhoto(setFrontPhoto, file)}
          />
          <PhotoField
            id="scan-back-photo"
            label="Ingredients and details"
            file={backPhoto}
            onSelect={(file) => updatePhoto(setBackPhoto, file)}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <PhotoField
              id="scan-whole-plant"
              label="Whole plant"
              file={wholePlantPhoto}
              onSelect={(file) => updatePhoto(setWholePlantPhoto, file)}
            />
            <PhotoField
              id="scan-problem-closeup"
              label="Close-up of the problem"
              file={closeUpPhoto}
              onSelect={(file) => updatePhoto(setCloseUpPhoto, file)}
            />
            <PhotoField
              id="scan-leaf-underside"
              label="Underside of a leaf (optional)"
              file={undersidePhoto}
              onSelect={(file) => updatePhoto(setUndersidePhoto, file)}
            />
          </div>
          <section className="grid gap-5 rounded-2xl bg-sage/50 p-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-forest sm:col-span-2">
              Plant name (optional)
              <input
                type="text"
                value={plantName}
                onChange={(event) => setPlantName(event.target.value)}
                maxLength={100}
                placeholder="e.g. Monstera deliciosa"
                className="min-h-11 rounded-lg border border-forest/15 bg-white px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              />
              <span className="text-xs font-normal text-forest/65">
                If you know what it is, we&apos;ll use the name as an identification hint.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-forest sm:col-span-2">
              What do you notice on the leaves? (optional)
              <textarea
                value={leafDescription}
                onChange={(event) => setLeafDescription(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Describe changes such as yellowing, spots, curling, or anything else you’ve noticed."
                className="min-h-24 resize-y rounded-lg border border-forest/15 bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              />
              <span className="text-xs font-normal text-forest/65">
                Your observations help tailor the diagnosis and care suggestions.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-forest">
              How often do you water it?
              <select
                value={watering}
                onChange={(event) => setWatering(event.target.value)}
                className="min-h-11 rounded-lg border border-forest/15 bg-white px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                <option value="">Choose an answer</option>
                <option value="daily">Every day</option>
                <option value="every_few_days">Every few days</option>
                <option value="weekly">About once a week</option>
                <option value="rarely">Less often</option>
                <option value="unsure">I&apos;m not sure</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-forest">
              What kind of light does it get?
              <select
                value={light}
                onChange={(event) => setLight(event.target.value)}
                className="min-h-11 rounded-lg border border-forest/15 bg-white px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                <option value="">Choose an answer</option>
                <option value="direct">Direct sunlight</option>
                <option value="bright_indirect">Bright, indirect light</option>
                <option value="low">Low light</option>
                <option value="unsure">I&apos;m not sure</option>
              </select>
            </label>
          </section>
        </>
      )}

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
          ) : null}
          {status === "reading"
            ? `Reading label ${ocrProgress}%`
            : status === "uploading"
              ? "Uploading photos…"
              : status === "analyzing"
                ? mode === "product"
                  ? "Reading ingredients and building your report…"
                  : "Identifying plant and building care plan…"
              : mode === "product"
                ? "Read label and build report"
                : "Identify plant and check health"}
        </button>

        {error ? (
          <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

      </div>
    </section>
  );
}