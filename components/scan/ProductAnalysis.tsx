import Link from "next/link";
import { AlertTriangle, Check, Info } from "lucide-react";
import type { ProductAnalysisResult, ProductVerdict } from "@/lib/api";
import LabelCorrection from "@/components/scan/LabelCorrection";
import ClearanceRequest from "@/components/scan/ClearanceRequest";

const riskLabels = {
  high: "Higher likelihood",
  moderate: "Some likelihood",
  medium: "Some likelihood",
  low: "Lower likelihood",
};

function VerdictSection({
  title,
  description,
  verdict,
}: {
  title: string;
  description: string;
  verdict: ProductVerdict;
}) {
  const label = verdict.risk
    ? riskLabels[verdict.risk]
    : verdict.evidence === "insufficient"
      ? "Not enough label evidence"
      : "Not determined";
  const tone = verdict.risk
    ? verdict.risk === "high"
      ? "bg-red-100 text-red-900"
      : verdict.risk === "moderate"
        ? "bg-amber-100 text-amber-950"
        : "bg-mint text-forest"
    : "bg-cream text-forest/75";

  return (
    <section className="rounded-2xl border border-forest/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-forest">{title}</h2>
          <p className="mt-1 max-w-prose text-sm leading-6 text-forest/70">
            {description}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tone}`}>
          {label}
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-forest/80">
        {verdict.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <Info className="mt-1 h-4 w-4 shrink-0 text-forest/55" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-forest/60">
        Label-based estimate; it is not a laboratory test.
      </p>
    </section>
  );
}

export default function ProductAnalysis({
  result,
  hideGmo = false,
  hideFluoride = false,
  hideAllergens = false,
  hideDietary = false,
  embedded = false,
}: {
  result: ProductAnalysisResult;
  hideGmo?: boolean;
  hideFluoride?: boolean;
  hideAllergens?: boolean;
  hideDietary?: boolean;
  embedded?: boolean;
}) {
  const { allergens } = result;
  const hasReadableIngredients = result.ingredients.length > 0;
  const Wrapper: "div" | "main" = embedded ? "div" : "main";

  return (
    <Wrapper
      className={
        embedded
          ? "flex w-full flex-col gap-7"
          : "mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-10"
      }
    >
      <header className="flex flex-col gap-2">
        {!embedded ? (
          <Link
            href="/dashboard/scan"
            className="w-fit text-sm font-medium text-forest/65 underline decoration-forest/30 underline-offset-4 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Back to scans
          </Link>
        ) : null}
        <h1 className="text-3xl font-bold leading-tight text-forest sm:text-4xl">
          {result.productName}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-forest/70">
          A plain-language reading of the package label. Ingredient-reading
          confidence: {Math.round(result.ingredientConfidence * 100)}%.
        </p>
      </header>

      {result.alerts.length > 0 ? (
        <section
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border-2 border-red-700/30 bg-red-50 p-4 sm:p-5"
        >
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-red-900">
                Heads up — this product may not be right for you
              </h2>
              <ul className="flex flex-col gap-2">
                {result.alerts.map((alert, index) => (
                  <li
                    key={`${alert.kind}-${alert.title}-${index}`}
                    className="text-sm leading-6 text-red-950"
                  >
                    <span className="font-semibold">{alert.title}.</span>{" "}
                    {alert.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {result.analysisWarnings.length > 0 ? (
        <aside
          className="rounded-2xl border border-amber-900/15 bg-amber-50 p-4 text-sm text-amber-950"
          role="status"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <ul className="space-y-1">
              {result.analysisWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}

      {!hideGmo || !hideFluoride ? (
        <div
          className={`grid gap-4 ${
            !hideGmo && !hideFluoride ? "md:grid-cols-2" : ""
          }`}
        >
          {!hideGmo ? (
            <VerdictSection
              title="GMO likelihood"
              description="Estimated from ingredients that may come from GM crops. This is not proof that the product contains GM material."
              verdict={result.gmoLikelihood}
            />
          ) : null}
          {!hideFluoride ? (
            <VerdictSection
              title="Fluoride on the label"
              description="Checks for fluoride ingredients or a fluoride-free claim in the readable label text."
              verdict={result.fluorideLikelihood}
            />
          ) : null}
        </div>
      ) : null}

      {!hideAllergens || !hideDietary ? (
        <section className="rounded-2xl border border-forest/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-forest">
                Your personalized checks
              </h2>
              <p className="mt-1 text-sm leading-6 text-forest/70">
                Choose which saved-preference checks appear in reports from your
                profile settings.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
            >
              Edit profile
            </Link>
          </div>

          <div
            className={`mt-5 grid gap-6 ${
              !hideAllergens && !hideDietary ? "sm:grid-cols-2" : ""
            }`}
          >
            {!hideAllergens ? (
              <div>
                <h3 className="text-sm font-semibold text-forest">Allergies</h3>
                {!hasReadableIngredients ? (
                  <p className="mt-2 text-sm leading-6 text-forest/70">
                    We could not read enough ingredients to check your saved
                    allergies.
                  </p>
                ) : allergens.savedAllergies.length === 0 ? (
                  <p className="mt-2 text-sm leading-6 text-forest/70">
                    No allergies are saved in your profile.
                  </p>
                ) : allergens.matches.mustAvoid.length > 0 ||
                  allergens.matches.caution.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-forest/80">
                    {allergens.matches.mustAvoid.map((hit) => (
                      <li
                        key={`${hit.allergen}-${hit.tier}`}
                        className="flex gap-2"
                      >
                        <AlertTriangle
                          className="mt-1 h-4 w-4 shrink-0 text-red-700"
                          aria-hidden="true"
                        />
                        <span>
                          <strong>{hit.label}</strong> appears as “
                          {hit.matchedTerm}” in the ingredients.
                        </span>
                      </li>
                    ))}
                    {allergens.matches.caution.map((hit) => (
                      <li
                        key={`${hit.allergen}-${hit.tier}`}
                        className="flex gap-2"
                      >
                        <Info
                          className="mt-1 h-4 w-4 shrink-0 text-amber-800"
                          aria-hidden="true"
                        />
                        <span>
                          The label says “may contain” {hit.label.toLowerCase()}.
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 flex gap-2 text-sm leading-6 text-forest/75">
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-forest"
                      aria-hidden="true"
                    />
                    No saved allergens were found in the readable ingredient list.
                  </p>
                )}
                {allergens.matches.otherPresent.length > 0 ? (
                  <p className="mt-3 text-xs leading-5 text-forest/60">
                    Other allergen terms found:{" "}
                    {allergens.matches.otherPresent
                      .map((hit) => hit.label)
                      .join(", ")}
                    .
                  </p>
                ) : null}
              </div>
            ) : null}

            {!hideDietary ? (
              <div>
                <h3 className="text-sm font-semibold text-forest">
                  Eating preferences
                </h3>
                {result.dietaryAssessments.length > 0 ? (
                  <ul className="mt-2 space-y-3">
                    {result.dietaryAssessments.map((assessment) => (
                      <li
                        key={assessment.preference}
                        className="text-sm leading-6"
                      >
                        <span className="font-semibold text-forest">
                          {assessment.preference}:{" "}
                        </span>
                        <span className="text-forest/75">
                          {assessment.status === "possible_conflict"
                            ? "possible conflict"
                            : assessment.status === "no_obvious_conflict"
                              ? "no obvious conflict"
                              : "unclear from the label"}
                          {" — "}
                          {assessment.explanation}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-forest/70">
                    No eating preferences are saved in your profile.
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <p className="mt-5 text-xs leading-5 text-forest/60">
            Label checks can miss undeclared ingredients or cross-contact. They
            cannot guarantee that a product is safe for you.
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-forest/10 bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-forest">
            Ingredients, in plain language
          </h2>
          <p className="mt-1 text-sm leading-6 text-forest/70">
            AI explanations use only the ingredients read from this package.
            Where a source is not stated, we say so rather than guess.
          </p>
        </div>
        {result.ingredients.length > 0 ? (
          <ol className="mt-4 divide-y divide-forest/10">
            {result.ingredients.map((ingredient, index) => (
              <li
                key={`${ingredient.name}-${index}`}
                className="grid gap-1 py-4 sm:grid-cols-[minmax(10rem,0.7fr)_1.3fr]"
              >
                <div>
                  <h3 className="font-semibold text-forest">{ingredient.name}</h3>
                  <p className="mt-1 text-xs font-medium text-forest/55">
                    {ingredient.role}
                  </p>
                </div>
                <p className="text-sm leading-6 text-forest/75">
                  {ingredient.explanation}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-xl bg-cream p-4 text-sm leading-6 text-forest/75">
            No ingredient list could be read confidently. The report will not
            guess at ingredients or mark the product low-risk.
          </p>
        )}
      </section>

      <ClearanceRequest scanId={result.id} clearance={result.clearance} />

      {!embedded ? (
        <details className="rounded-2xl border border-forest/10 bg-cream/65 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
            Review or correct the text read from the package
          </summary>
          <p className="mt-3 max-w-prose text-sm leading-6 text-forest/70">
            Automatic text is hidden because it may be hard to read. Type out all
            ingredients exactly as they appear on the label, including sub-ingredients
            and any “may contain” statement. Save your text to rebuild the report.
            Leave it blank if you cannot read the label.
          </p>
          <LabelCorrection scanId={result.id} />
        </details>
      ) : null}
    </Wrapper>
  );
}
