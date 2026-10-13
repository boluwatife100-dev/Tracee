"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Clock3,
  Leaf,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type {
  DiseaseCandidate,
  PlantCandidate,
  PlantSymptom,
} from "@/lib/plant-types";
import type { ClearanceInfo } from "@/lib/api";
import ClearanceRequest from "@/components/scan/ClearanceRequest";

type CareTaskView = {
  id: string;
  title: string;
  detail: string | null;
  dueAt: string | null;
  recurrence: string | null;
};

export type PlantAnalysisView = {
  id: string;
  status: string;
  plantName: string;
  diagnosis: string;
  summary: string | null;
  candidates: PlantCandidate[];
  diseases: DiseaseCandidate[];
  symptoms: PlantSymptom[];
  needsBetterPhoto: boolean;
  scanDate: string;
  imageUrl: string | null;
  tasks: CareTaskView[];
  clearance: ClearanceInfo | null;
};

function Confidence({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  return (
    <span className="text-sm font-semibold tabular-nums text-forest">
      {percentage}% match
    </span>
  );
}

function RetryDiagnosis({ scanId }: { scanId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/scans/${scanId}/diagnosis`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not analyze this scan.");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not analyze this scan."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Analyzing…" : "Retry analysis"}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PlantPhoto({ result }: { result: PlantAnalysisView }) {
  if (result.imageUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sage">
        <Image
          src={result.imageUrl}
          alt={`${result.plantName} scan photo`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-sage text-forest/35">
      <Leaf className="h-16 w-16" aria-hidden="true" />
    </div>
  );
}

export default function PlantAnalysis({ result }: { result: PlantAnalysisView }) {
  const topDisease = result.diseases[0];
  const isPending =
    result.status === "failed" ||
    result.status === "awaiting_plant_diagnosis" ||
    result.status === "pending";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/dashboard/my-plant"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-forest transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All plant scans
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-forest sm:text-4xl">
            {result.diagnosis}
          </h1>
          <p className="text-sm text-forest/65">
            Scan from{" "}
            <time dateTime={result.scanDate}>
              {new Intl.DateTimeFormat("en", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(result.scanDate))}
            </time>
          </p>
        </div>
      </header>

      {result.needsBetterPhoto ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-800/15 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-amber-950">We need a clearer photo</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-900/80">
                The species match is too uncertain to recommend treatment safely.
                Try a bright, in-focus photo of the full plant and the affected area.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/scan?type=plant"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-forest ring-1 ring-forest/15 transition-colors hover:bg-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Take new photos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {result.status === "analyzing" ? (
        <section
          className="flex items-start gap-3 rounded-2xl bg-sage/60 p-5 text-forest"
          role="status"
        >
          <LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Analysis in progress</h2>
            <p className="mt-1 text-sm leading-6 text-forest/70">
              Plant identification and the care-plan review are still running.
              Refresh this page shortly to see the result.
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col gap-5">
          <PlantPhoto result={result} />
          <section className="rounded-2xl bg-sage p-5 sm:p-6">
            <h2 className="font-semibold text-forest">Plant candidates</h2>
            {result.candidates.length ? (
              <ol className="mt-4 divide-y divide-forest/10">
                {result.candidates.map((candidate, index) => (
                  <li
                    key={`${candidate.species}-${index}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-forest">
                        {candidate.commonName ?? candidate.species}
                      </p>
                      {candidate.commonName ? (
                        <p className="mt-0.5 text-xs text-forest/65">
                          {candidate.species}
                        </p>
                      ) : null}
                    </div>
                    {candidate.source === "owner" ? (
                      <span className="text-sm text-forest/65">
                        Provided by you
                      </span>
                    ) : (
                      <Confidence value={candidate.confidence} />
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-forest/70">
                No reliable species candidate was returned.
              </p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-7">
          {isPending ? (
            <section className="flex flex-col items-start gap-4 rounded-2xl border border-forest/10 p-5 sm:p-6">
              <div>
                <h2 className="font-semibold text-forest">Analysis didn&apos;t finish</h2>
                <p className="mt-1 text-sm leading-6 text-forest/70">
                  Your photos are saved. Retry the identification and health
                  assessment to get a care plan.
                </p>
              </div>
              <RetryDiagnosis scanId={result.id} />
            </section>
          ) : null}

          {result.summary ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold text-forest">
                {topDisease ? "What we found" : "Health check"}
              </h2>
              <p className="max-w-prose text-sm leading-7 text-forest/75">
                {result.summary}
              </p>
            </section>
          ) : null}

          {result.diseases.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold text-forest">
                Health candidates
              </h2>
              <ul className="divide-y divide-forest/10">
                {result.diseases.map((disease, index) => (
                  <li
                    key={`${disease.name}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <span className="text-sm font-semibold text-forest">
                      {disease.name}
                    </span>
                    <Confidence value={disease.confidence} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.symptoms.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold text-forest">
                Visible signs to check
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {result.symptoms.map((symptom) => (
                  <li key={symptom.name}>
                    <p className="text-sm font-semibold text-forest">
                      {symptom.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-forest/65">
                      {symptom.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ClearanceRequest scanId={result.id} clearance={result.clearance} />

          {result.tasks.length ? (
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-forest">
                  Recommended care
                </h2>
                <p className="mt-1 text-sm text-forest/65">
                  These tasks have been added to your care checklist.
                </p>
              </div>
              <ul className="divide-y divide-forest/10 border-y border-forest/10">
                {result.tasks.map((task) => (
                  <li key={task.id} className="flex gap-3 py-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-forest">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-forest">
                        {task.title}
                      </h3>
                      {task.detail ? (
                        <p className="mt-1 text-sm leading-6 text-forest/65">
                          {task.detail}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs font-medium text-forest/55">
                        {task.dueAt
                          ? `Due ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(task.dueAt))}`
                          : "No due date"}
                        {task.recurrence ? ` · ${task.recurrence}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard#care-checklist"
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                View care checklist
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
