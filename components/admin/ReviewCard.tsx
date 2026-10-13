import { AlertTriangle, Leaf, Package } from "lucide-react";
import { reviewClearance } from "@/app/admin/review/actions";
import ReviewActions from "@/components/admin/ReviewActions";

export type ReviewPhoto = { label: string; url: string | null };
export type ReviewFact = { label: string; value: string };
export type ReviewVerdict = {
  title: string;
  risk: string | null;
  confidence: number;
  reasons: string[];
};
export type ReviewIngredient = {
  name: string;
  explanation: string;
  role: string;
};

export type ReviewQueueItem = {
  requestId: string;
  shortId: string;
  kind: "product" | "plant";
  title: string;
  subtitle: string | null;
  reasonLabel: string;
  status: string;
  submittedAt: string;
  statusLabel: string;
  photos: ReviewPhoto[];
  facts: ReviewFact[];
  claims: string[];
  mayContain: string | null;
  ingredients: string[];
  ingredientExplanations: ReviewIngredient[];
  verdicts: ReviewVerdict[];
  allergens: { label: string; matchedTerm: string; tier: string }[];
  ocrText: string | null;
  ocrConfidence: number | null;
  plant: {
    candidates: { name: string; confidence: number }[];
    diseases: { name: string; confidence: number; evidence: string }[];
    symptoms: { name: string; detail: string }[];
    summary: string | null;
  } | null;
  submitter: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    allergies: string[];
    dietary: string[];
  };
};

const RISK_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  moderate: "bg-amber-100 text-amber-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  cleared: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  needs_info: "bg-sky-100 text-sky-800",
};

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function FactRow({ label, value }: ReviewFact) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-forest/5 py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-forest/45">
        {label}
      </dt>
      <dd className="text-sm font-medium text-forest sm:text-right">{value}</dd>
    </div>
  );
}

function VerdictPanel({ verdict }: { verdict: ReviewVerdict }) {
  const riskClass = verdict.risk ? RISK_STYLES[verdict.risk] ?? "bg-sage text-forest" : "bg-sage text-forest";
  return (
    <div className="rounded-xl border border-forest/10 bg-cream/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-forest">{verdict.title}</p>
        <div className="flex items-center gap-2">
          <Chip className={riskClass}>{verdict.risk ?? "no rating"}</Chip>
          <span className="text-xs font-medium tabular-nums text-forest/60">
            {Math.round(verdict.confidence * 100)}% conf.
          </span>
        </div>
      </div>
      {verdict.reasons.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-forest/70">
          {verdict.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PhotoTile({ photo }: { photo: ReviewPhoto }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-forest/10 bg-sage/40">
      {photo.url ? (
        // Cloudinary scan images are authenticated and use short-lived signed URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt={`${photo.label} photo`}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center text-forest/35">
          <Package className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
      <figcaption className="px-3 py-2 text-xs font-medium text-forest/60">
        {photo.label}
      </figcaption>
    </figure>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-forest/45">
      {children}
    </h3>
  );
}

export default function ReviewCard({ item }: { item: ReviewQueueItem }) {
  const isPlant = item.kind === "plant";
  const KindIcon = isPlant ? Leaf : Package;

  return (
    <article className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-forest/10 bg-sage/40 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Chip className="bg-forest/10 text-forest">
              <KindIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {isPlant ? "Plant scan" : "Product scan"}
            </Chip>
            <span className="font-mono text-xs text-forest/50">
              #{item.shortId}
            </span>
          </div>
          <h2 className="mt-2 truncate text-xl font-bold text-forest">
            {item.title}
          </h2>
          {item.subtitle ? (
            <p className="mt-0.5 text-sm text-forest/65">{item.subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Chip className={STATUS_STYLES[item.status] ?? "bg-sage text-forest"}>
            {item.statusLabel}
          </Chip>
          <p className="text-xs text-forest/60">{item.reasonLabel}</p>
          <time className="text-xs text-forest/45" dateTime={item.submittedAt}>
            {item.submittedAt}
          </time>
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionTitle>Scanned photos</SectionTitle>
            {item.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {item.photos.map((photo) => (
                  <PhotoTile key={photo.label} photo={photo} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-forest/60">No photos attached.</p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <SectionTitle>Submitted by</SectionTitle>
            <div className="rounded-xl border border-forest/10 bg-cream/50 p-3">
              <p className="text-sm font-semibold text-forest">
                {item.submitter.name}
              </p>
              {item.submitter.email ? (
                <p className="text-xs text-forest/60">{item.submitter.email}</p>
              ) : null}
              <p className="mt-1 font-mono text-[11px] text-forest/45">
                {item.submitter.id}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-forest/45">
                    Saved allergies
                  </p>
                  <p className="text-xs text-forest/70">
                    {item.submitter.allergies.length
                      ? item.submitter.allergies.join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-forest/45">
                    Dietary preferences
                  </p>
                  <p className="text-xs text-forest/70">
                    {item.submitter.dietary.length
                      ? item.submitter.dietary.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {item.facts.length > 0 ? (
            <section>
              <SectionTitle>Label details</SectionTitle>
              <dl className="mt-2">
                {item.facts.map((fact) => (
                  <FactRow key={fact.label} {...fact} />
                ))}
              </dl>
            </section>
          ) : null}

          {item.claims.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle>Claims on pack</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {item.claims.map((claim) => (
                  <Chip key={claim} className="bg-mint text-forest">
                    {claim}
                  </Chip>
                ))}
              </div>
            </section>
          ) : null}

          {item.allergens.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle>Allergens detected</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {item.allergens.map((allergen) => (
                  <Chip
                    key={`${allergen.label}-${allergen.tier}`}
                    className={
                      allergen.tier === "contains"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {allergen.label}
                    <span className="ml-1 font-normal opacity-70">
                      {allergen.tier === "contains" ? "contains" : "may contain"}
                    </span>
                  </Chip>
                ))}
              </div>
              {item.mayContain ? (
                <p className="text-xs leading-5 text-forest/60">
                  &ldquo;May contain&rdquo; statement: {item.mayContain}
                </p>
              ) : null}
            </section>
          ) : null}

          {isPlant && item.plant ? (
            <section className="flex flex-col gap-3">
              <SectionTitle>Plant identification</SectionTitle>
              {item.plant.summary ? (
                <p className="text-sm leading-6 text-forest/75">
                  {item.plant.summary}
                </p>
              ) : null}
              {item.plant.candidates.length > 0 ? (
                <ul className="flex flex-col gap-1 text-sm text-forest/80">
                  {item.plant.candidates.map((candidate) => (
                    <li
                      key={candidate.name}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{candidate.name}</span>
                      <span className="tabular-nums text-forest/55">
                        {Math.round(candidate.confidence * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.plant.diseases.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {item.plant.diseases.map((disease) => (
                    <div
                      key={disease.name}
                      className="rounded-xl border border-forest/10 bg-cream/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-forest">
                          {disease.name}
                        </p>
                        <span className="text-xs tabular-nums text-forest/55">
                          {Math.round(disease.confidence * 100)}%
                        </span>
                      </div>
                      {disease.evidence ? (
                        <p className="mt-1 text-xs leading-5 text-forest/65">
                          {disease.evidence}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {item.plant.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.plant.symptoms.map((symptom) => (
                    <Chip key={symptom.name} className="bg-sage text-forest">
                      {symptom.name}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {!isPlant && item.verdicts.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionTitle>Automated verdicts</SectionTitle>
              {item.verdicts.map((verdict) => (
                <VerdictPanel key={verdict.title} verdict={verdict} />
              ))}
            </section>
          ) : null}

          {!isPlant && item.ingredientExplanations.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle>Ingredients</SectionTitle>
              <ul className="flex flex-col gap-2">
                {item.ingredientExplanations.map((ingredient) => (
                  <li
                    key={ingredient.name}
                    className="rounded-xl border border-forest/10 bg-cream/40 p-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-forest">
                        {ingredient.name}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-forest/45">
                        {ingredient.role}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-forest/65">
                      {ingredient.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!isPlant && item.ingredientExplanations.length === 0 && item.ingredients.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle>Ingredients</SectionTitle>
              <p className="text-sm leading-6 text-forest/75">
                {item.ingredients.join(", ")}
              </p>
            </section>
          ) : null}

          {!isPlant ? (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <SectionTitle>Raw label text (OCR)</SectionTitle>
                {item.ocrConfidence !== null ? (
                  <span className="text-xs tabular-nums text-forest/55">
                    {item.ocrConfidence}% OCR confidence
                  </span>
                ) : null}
              </div>
              {item.ocrText ? (
                <details className="rounded-xl border border-forest/10 bg-cream/40 p-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-forest">
                    Show {item.ocrText.length.toLocaleString()} characters
                  </summary>
                  <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-forest/75">
                    {item.ocrText}
                  </pre>
                </details>
              ) : (
                <p className="text-sm text-forest/60">
                  No label text was captured for this scan.
                </p>
              )}
            </section>
          ) : null}

          {item.ingredients.length === 0 && !isPlant && item.verdicts.length === 0 ? (
            <p className="flex items-start gap-2 rounded-xl border border-amber-900/15 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              The automated read produced little usable data for this scan. Review the
              photos and label text before deciding.
            </p>
          ) : null}
        </div>
      </div>

      <form
        action={reviewClearance}
        className="flex flex-col gap-3 border-t border-forest/10 bg-cream/40 px-5 py-4 sm:px-6"
      >
        <input type="hidden" name="id" value={item.requestId} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-forest/45">
            Reviewer note (optional)
          </span>
          <textarea
            name="note"
            rows={2}
            placeholder="Record why you approved, rejected, or asked for more information."
            className="w-full resize-y rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          />
        </label>
        <ReviewActions />
      </form>
    </article>
  );
}
