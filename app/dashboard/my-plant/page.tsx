import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Leaf, Plus, ScanSearch } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  parsePlantCandidates,
  parsePlantFindings,
} from "@/lib/plant-types";
import { getAuthenticatedScanImageUrl } from "@/lib/scan-image";

export const metadata = {
  title: "My Plant — Tracee",
  description: "Review your plant diagnoses and care recommendations.",
};

function statusLabel(status: string, needsBetterPhoto: boolean): string {
  if (needsBetterPhoto) return "Need a clearer photo";
  if (status === "analyzed") return "Care plan ready";
  if (status === "analyzing") return "Analysis in progress";
  if (status === "failed") return "Analysis needs retry";
  return "Scan saved";
}

export default async function MyPlantPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const scans = await prisma.scan.findMany({
    where: { userId, kind: "plant" },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      plant: {
        select: {
          candidates: true,
          diagnosis: true,
          needsBetterPhoto: true,
          summary: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
            My plant scans
          </h1>
          <p className="mt-3 text-base leading-7 text-forest/70">
            Your past identifications, health checks, and care plans in one place.
          </p>
        </div>
        <Link
          href="/dashboard/scan?type=plant"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Scan a plant
        </Link>
      </header>

      {scans.length === 0 ? (
        <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-forest/20 bg-sage/30 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-forest">
            <ScanSearch className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-forest">
            Your plant journal starts here
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-forest/70">
            Add a whole-plant photo and a close-up of the issue. We&apos;ll compare
            identification and health results before suggesting next steps.
          </p>
          <Link
            href="/dashboard/scan?type=plant"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-forest/20 bg-white px-4 text-sm font-semibold text-forest transition-colors hover:bg-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Start your first scan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <section aria-label="Past plant scans" className="grid gap-4">
          {scans.map((scan) => {
            const candidates = parsePlantCandidates(scan.plant?.candidates);
            const findings = parsePlantFindings(scan.plant?.diagnosis);
            const plantName =
              candidates[0]?.commonName ?? candidates[0]?.species ?? "Plant scan";
            const concern = findings.diseases[0]?.name;
            const imageUrl = getAuthenticatedScanImageUrl(scan.photoIds);
            const label = statusLabel(
              scan.status,
              scan.plant?.needsBetterPhoto ?? false
            );

            return (
              <article
                key={scan.id}
                className="grid overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[170px_1fr]"
              >
                <div className="relative min-h-44 bg-sage sm:min-h-full">
                  {imageUrl ? (
                    // Cloudinary scan images are authenticated and use short-lived signed URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`${plantName} scan`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-forest/35">
                      <Leaf className="h-12 w-12" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-forest">
                        {plantName}
                      </h2>
                      <p className="mt-1 text-sm text-forest/65">
                        {concern ?? (scan.plant ? "No clear disease candidate" : "Diagnosis pending")}
                      </p>
                    </div>
                    <span className="inline-flex min-h-7 items-center rounded-full bg-mint px-3 text-xs font-semibold text-forest">
                      {label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-forest/60">
                    <span>
                      {candidates.length
                        ? `${Math.round(candidates[0].confidence * 100)}% top species match`
                        : "Species match pending"}
                    </span>
                    <time dateTime={scan.createdAt.toISOString()}>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(scan.createdAt)}
                    </time>
                  </div>

                  <Link
                    href={`/dashboard/my-plant/${scan.id}`}
                    className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                  >
                    View scan results
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
