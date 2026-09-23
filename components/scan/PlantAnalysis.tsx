import Image from "next/image";
import Link from "next/link";
import type { PlantScanResult, TreatmentAction } from "@/lib/api";
import {
  PlantIcon,
  ScissorsIcon,
  AirflowIcon,
  SprayIcon,
  DropletIcon,
} from "@/components/ui/icons";

const TREATMENT_ICONS: Record<TreatmentAction, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  prune: ScissorsIcon,
  airflow: AirflowIcon,
  spray: SprayIcon,
  water: DropletIcon,
};

function PlantPhoto({ result }: { result: PlantScanResult }) {
  if (result.imageUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
        <Image
          src={result.imageUrl}
          alt={`${result.plantName} scan photo`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#eaf3de_0%,#dceece_100%)]">
      <PlantIcon className="h-24 w-24 text-forest/25" />
    </div>
  );
}

export default function PlantAnalysis({ result }: { result: PlantScanResult }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest transition-opacity hover:opacity-70"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[3rem] lg:leading-[1.1]">
          {result.diagnosis}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-6">
          <PlantPhoto result={result} />

          <section className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
            <h2 className="text-lg font-semibold text-forest">
              Scan Information
            </h2>
            <dl className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-gray-500">Affected Plant</dt>
                <dd className="text-right text-sm font-bold text-forest">
                  {result.plantName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-gray-500">Scan Date</dt>
                <dd className="text-right text-sm font-bold text-forest">
                  {result.scanDate}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-gray-500">Assigned Location</dt>
                <dd className="text-right text-sm font-bold text-forest">
                  {result.assignedLocation}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-forest">What is this?</h2>
            <p className="text-base leading-relaxed text-gray-600">
              {result.summary}
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-forest">
              Key Symptoms Found
            </h2>
            <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {result.symptoms.map((symptom) => (
                <li key={symptom.name} className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-forest" />
                    <span className="text-sm font-bold text-forest">
                      {symptom.name}
                    </span>
                  </span>
                  <p className="pl-5 text-sm leading-relaxed text-gray-500">
                    {symptom.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-forest">
              Recommended Treatment Plan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.treatment.map((step) => {
                const Icon = TREATMENT_ICONS[step.action];
                return (
                  <article
                    key={step.title}
                    className="flex flex-col gap-3 rounded-2xl border border-forest/10 bg-white p-5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-bold text-forest">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-500">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-forest bg-white px-6 text-sm font-semibold text-forest transition-colors hover:bg-forest/5"
        >
          Save to My plants
        </button>
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-dark"
        >
          Start Care Routine
        </button>
      </div>
    </div>
  );
}