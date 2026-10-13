import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedImageUrl } from "@/lib/scan-image";
import { detectAllergens } from "@/lib/engines/allergen";
import { normalizeIngredients } from "@/lib/engines/normalize";
import {
  asRecord,
  parsePlantCandidates,
  parsePlantFindings,
} from "@/lib/plant-types";
import ReviewCard, {
  type ReviewFact,
  type ReviewQueueItem,
  type ReviewVerdict,
} from "@/components/admin/ReviewCard";

export const metadata = {
  title: "Admin review queue — Tracee",
  description: "Review flagged scans and make an informed clearance decision.",
};

const REASON_LABELS: Record<string, string> = {
  insufficient_evidence: "Automatic read was not confident enough",
  no_catalog_match: "Product could not be matched to the catalog",
  user_request: "User asked for a manual review",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  cleared: "Cleared",
  rejected: "Rejected",
  needs_info: "Needs more info",
};

const WATERING_LABELS: Record<string, string> = {
  daily: "Daily",
  every_few_days: "Every few days",
  weekly: "Weekly",
  rarely: "Rarely",
  unsure: "Not sure",
};

const LIGHT_LABELS: Record<string, string> = {
  direct: "Direct sunlight",
  bright_indirect: "Bright indirect light",
  low: "Low light",
  unsure: "Not sure",
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toVerdict(title: string, value: unknown): ReviewVerdict | null {
  const record = asRecord(value);
  if (!record) return null;
  const reasons = Array.isArray(record.reasons)
    ? record.reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  return {
    title,
    risk: str(record.risk),
    confidence: typeof record.confidence === "number" ? record.confidence : 0,
    reasons,
  };
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminReviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  // The admin layout already enforces the admin role for this whole section.
  const pendingRequests = await prisma.clearanceRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      scan: {
        include: { product: true, plant: true },
      },
    },
  });

  const userIds = Array.from(
    new Set(pendingRequests.map((request) => request.scan.userId))
  );
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } } })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const items: ReviewQueueItem[] = pendingRequests.map((request) => {
    const scan = request.scan;
    const isPlant = scan.kind === "plant";
    const extraction = asRecord(scan.extraction);
    const analysis = asRecord(scan.analysis);
    const photoIds = asRecord(scan.photoIds) ?? {};
    const user = userMap.get(scan.userId);

    const submitterName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      str(user?.username) ||
      str(user?.email) ||
      "Unknown user";

    const photoKeys: [string, string][] = isPlant
      ? [
          ["Whole plant", "whole"],
          ["Close-up", "closeUp"],
          ["Underside", "underside"],
          ["Front", "front"],
        ]
      : [
          ["Front", "front"],
          ["Back", "back"],
        ];
    const photos = photoKeys.flatMap(([label, key]) => {
      const publicId = photoIds[key];
      if (typeof publicId !== "string") return [];
      return [{ label, url: getAuthenticatedImageUrl(publicId) }];
    });

    const extractedText = asRecord(analysis?.extractedText);
    const ingredientsSource =
      str(extraction?.ingredientsText) ??
      str(extractedText?.inferred) ??
      str(scan.ocrText);
    const ingredients = ingredientsSource
      ? normalizeIngredients(ingredientsSource)
      : [];

    const mayContain = str(extraction?.mayContainText);
    const allergens = detectAllergens(ingredients, mayContain ?? "").map((hit) => ({
      label: hit.label,
      matchedTerm: hit.matchedTerm,
      tier: hit.tier,
    }));

    const claims = Array.isArray(extraction?.claims)
      ? extraction.claims.filter((claim): claim is string => typeof claim === "string")
      : [];

    const ingredientExplanations = (
      Array.isArray(analysis?.ingredients) ? analysis.ingredients : []
    ).flatMap((entry) => {
      const record = asRecord(entry);
      const name = str(record?.name);
      if (!name) return [];
      return [
        {
          name,
          explanation: str(record?.explanation) ?? "",
          role: str(record?.role) ?? "",
        },
      ];
    });

    const verdicts = [
      toVerdict("GMO likelihood", analysis?.gmoLikelihood),
      toVerdict("Fluoride likelihood", analysis?.fluorideLikelihood),
    ].filter((verdict): verdict is ReviewVerdict => verdict !== null);

    const facts: ReviewFact[] = [];
    const addFact = (label: string, value: unknown) => {
      const text = str(value);
      if (text) facts.push({ label, value: text });
    };

    const plantFindings = isPlant
      ? parsePlantFindings(scan.plant?.diagnosis)
      : { diseases: [], symptoms: [] };
    const plantCandidates = isPlant
      ? parsePlantCandidates(scan.plant?.candidates)
      : [];

    if (isPlant) {
      const plantContext = asRecord(scan.plantContext);
      addFact("User's plant name", plantContext?.name);
      addFact(
        "Watering",
        str(plantContext?.watering)
          ? WATERING_LABELS[str(plantContext?.watering) as string] ??
              str(plantContext?.watering)
          : null
      );
      addFact(
        "Light",
        str(plantContext?.light)
          ? LIGHT_LABELS[str(plantContext?.light) as string] ??
              str(plantContext?.light)
          : null
      );
      addFact("Leaf description", plantContext?.leafDescription);
    } else {
      addFact("Product type", extraction?.productType);
      addFact("Brand", extraction?.brand ?? scan.product?.brand);
      addFact("Manufacturer", extraction?.manufacturer);
      addFact("Country of origin", extraction?.countryOfOrigin);
      addFact("NAFDAC no.", extraction?.nafdacNo ?? scan.product?.nafdacNo);
      addFact("Barcode", extraction?.barcodeDigits ?? scan.product?.gtin);
      addFact("Batch number", extraction?.batchNo);
      addFact("Expiry", extraction?.expiryText ?? scan.product?.expiryText);
      addFact("Manufactured", extraction?.manufactureDateText);
      if (scan.product) {
        addFact("Catalog match", scan.product.name ?? scan.product.nameKey);
        addFact("Catalog source", scan.product.source);
      }
    }

    const title = isPlant
      ? plantCandidates[0]?.commonName ??
        plantCandidates[0]?.species ??
        str(asRecord(scan.plantContext)?.name) ??
        "Plant scan"
      : str(extraction?.productName) ??
        scan.product?.name ??
        "Scanned product";

    const subtitle = isPlant
      ? plantFindings.diseases[0]?.name ?? null
      : str(extraction?.brand) ?? scan.product?.brand ?? null;

    return {
      requestId: request.id,
      shortId: request.id.slice(-6),
      kind: isPlant ? "plant" : "product",
      title,
      subtitle,
      reasonLabel:
        REASON_LABELS[request.reason] ?? "Sent to the review queue",
      status: request.status,
      statusLabel: STATUS_LABELS[request.status] ?? request.status,
      submittedAt: formatDateTime(request.createdAt),
      photos,
      facts,
      claims,
      mayContain,
      ingredients,
      ingredientExplanations,
      verdicts,
      allergens,
      ocrText: isPlant ? null : str(scan.ocrText),
      ocrConfidence: isPlant ? null : scan.ocrConfidence,
      plant: isPlant
        ? {
            candidates: plantCandidates.map((candidate) => ({
              name: candidate.commonName ?? candidate.species,
              confidence: candidate.confidence,
            })),
            diseases: plantFindings.diseases.map((disease) => ({
              name: disease.name,
              confidence: disease.confidence,
              evidence: disease.evidence,
            })),
            symptoms: plantFindings.symptoms,
            summary: str(scan.plant?.summary),
          }
        : null,
      submitter: {
        id: scan.userId,
        name: submitterName,
        email: str(user?.email),
        username: str(user?.username),
        allergies: user?.allergies ?? [],
        dietary: user?.dietary ?? [],
      },
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-forest">
          Review queue
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-forest/65">
          Scans that need a human decision. Each card carries the captured label
          data, automated verdicts, and submitter context so you can approve,
          reject, or ask for more information.
        </p>
      </header>

      {items.length === 0 ? (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-forest/20 bg-sage/30 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-forest">
            <Inbox className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-forest">
            You&apos;re all caught up
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-forest/70">
            No scans are waiting for review right now. New requests will appear
            here automatically.
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          {items.map((item) => (
            <ReviewCard key={item.requestId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
