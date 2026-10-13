"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LabelCorrection({
  scanId,
}: {
  scanId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveCorrection() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch(`/api/scans/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: text }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save the corrected label text.");
      }
      setSaved(true);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save the corrected label text."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <label
        htmlFor="corrected-label-text"
        className="text-sm font-semibold text-forest"
      >
        Label text
      </label>
      <textarea
        id="corrected-label-text"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
        maxLength={150_000}
        rows={7}
        placeholder="Type all ingredients exactly as printed on the label."
        className="w-full resize-y rounded-lg border border-forest/20 bg-white p-3 text-sm leading-6 text-forest outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={saveCorrection}
          className="min-h-10 rounded-lg bg-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:bg-forest/40"
        >
          {saving ? "Saving…" : "Save correction and refresh report"}
        </button>
        {saved ? (
          <span className="text-sm text-forest" role="status">
            Correction saved. The report is refreshing.
          </span>
        ) : null}
        {error ? (
          <span className="text-sm text-red-800" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
