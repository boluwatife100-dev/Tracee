"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type {
  ProductAnalysisResult,
  RiskLevel,
  UserPreferences,
} from "@/lib/api";
import {
  BoxIcon,
  DocumentIcon,
  ChevronRightIcon,
  CheckIcon,
  AlertIcon,
} from "@/components/ui/icons";

const RISK_STYLES: Record<RiskLevel, string> = {
  high: "bg-red-600 text-white",
  medium: "bg-amber-400 text-forest",
  low: "bg-green-600 text-white",
};

const NON_VEGETARIAN = [
  "gelatin",
  "beef",
  "chicken",
  "pork",
  "lamb",
  "fish",
  "shrimp",
  "prawn",
];

function hasIngredient(
  ingredients: ProductAnalysisResult["ingredients"],
  term: string
) {
  return ingredients.some((ingredient) =>
    ingredient.name.toLowerCase().includes(term.toLowerCase())
  );
}

function isDietaryMet(
  preference: string,
  ingredients: ProductAnalysisResult["ingredients"]
) {
  const key = preference.toLowerCase();
  if (key.includes("vegetarian") || key.includes("vegan")) {
    return !ingredients.some((ingredient) =>
      NON_VEGETARIAN.some((source) =>
        ingredient.name.toLowerCase().includes(source)
      )
    );
  }
  return true;
}

function ProductPhoto({ result }: { result: ProductAnalysisResult }) {
  if (result.imageUrl) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={result.imageUrl}
          alt={`${result.productName} package photo`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="aspect-[4/3] w-full"
      style={{
        backgroundImage:
          "conic-gradient(#e5e7eb 90deg, #f3f4f6 90deg 180deg, #e5e7eb 180deg 270deg, #f3f4f6 270deg)",
        backgroundSize: "24px 24px",
      }}
      role="img"
      aria-label={`${result.productName} image placeholder`}
    />
  );
}

function ProductCard({ result }: { result: ProductAnalysisResult }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-forest/10 bg-white">
      <ProductPhoto result={result} />
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold leading-tight text-forest">
            {result.productName}
          </h2>
          <p className="text-sm text-gray-500">{result.manufacturer}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-forest/5 pt-4">
          <p className="text-sm">
            <span className="text-gray-500">NAFDAC REG NO: </span>
            <span className="font-bold text-forest">{result.nafdacRegNo}</span>
          </p>
          {result.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
              <CheckIcon className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function GmoCard({
  likelihood,
}: {
  likelihood: ProductAnalysisResult["gmoLikelihood"];
}) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-forest/10 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
          <BoxIcon className="h-5 w-5" />
        </span>
        <div className="flex flex-1 items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-forest">
            GMO Likelihood
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${RISK_STYLES[likelihood.level]}`}
          >
            {likelihood.level.toUpperCase()}
          </span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-gray-500">
        {likelihood.description}
      </p>
    </article>
  );
}

function IngredientsCard({
  ingredients,
}: {
  ingredients: ProductAnalysisResult["ingredients"];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-forest/10 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
          <DocumentIcon className="h-5 w-5" />
        </span>
        <h3 className="flex-1 text-base font-semibold text-forest">
          Detected Ingredients
        </h3>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide ingredients" : "Show ingredients"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-forest/60 transition-colors hover:bg-forest/5 hover:text-forest"
        >
          <ChevronRightIcon
            className={`h-4 w-4 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {expanded ? (
        <ul className="flex flex-col divide-y divide-forest/5">
          {ingredients.map((ingredient) => (
            <li key={ingredient.name} className="flex flex-col gap-0.5 py-2.5">
              <span className="text-sm font-semibold text-forest">
                {ingredient.name}
              </span>
              {ingredient.note ? (
                <span className="text-xs leading-relaxed text-gray-500">
                  {ingredient.note}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-gray-500">
          {ingredients.map((ingredient) => ingredient.name).join(", ")}
        </p>
      )}
    </article>
  );
}

function OriginalityCard({
  result,
}: {
  result: ProductAnalysisResult;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-forest/10 bg-white p-6">
      <h3 className="text-base font-semibold text-forest">
        Check for Originality
      </h3>
      <p className="text-sm">
        <span className="text-gray-500">NAFDAC REG NO: </span>
        <span className="font-bold text-forest">{result.nafdacRegNo}</span>
      </p>
    </article>
  );
}

function PreferencesCard({
  preferences,
  result,
}: {
  preferences: UserPreferences;
  result: ProductAnalysisResult;
}) {
  const allergyRows = preferences.allergies.map((allergy) => ({
    name: allergy,
    found: hasIngredient(result.ingredients, allergy),
  }));
  const dietaryRows = preferences.dietary.map((preference) => ({
    name: preference,
    suitable: isDietaryMet(preference, result.ingredients),
  }));

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-forest/10 bg-white p-6">
      <h3 className="text-base font-semibold text-forest">
        Your Preferences
      </h3>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Allergies
        </p>
        <ul className="flex flex-col gap-2.5">
          {allergyRows.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-forest">
                {row.name}
              </span>
              {row.found ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                  <AlertIcon className="h-3.5 w-3.5" />
                  Found
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-400">
                  Not found
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px w-full bg-forest/5" />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Dietary Preferences
        </p>
        <ul className="flex flex-col gap-2.5">
          {dietaryRows.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-forest">
                {row.name}
              </span>
              {row.suitable ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Suitable
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                  <AlertIcon className="h-3.5 w-3.5" />
                  Not suitable
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function ProductAnalysis({
  result,
  preferences,
}: {
  result: ProductAnalysisResult;
  preferences: UserPreferences;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
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

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <ProductCard result={result} />

        <div className="flex flex-col gap-6">
          <GmoCard likelihood={result.gmoLikelihood} />
          <IngredientsCard ingredients={result.ingredients} />
          <OriginalityCard result={result} />
        </div>

        <PreferencesCard preferences={preferences} result={result} />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/scan"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-forest bg-white px-6 text-sm font-semibold text-forest transition-colors hover:bg-forest/5"
        >
          Scan another Product
        </Link>
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-dark"
        >
          Save Analysis
        </button>
      </div>
    </div>
  );
}