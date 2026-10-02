"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { savePreferences } from "@/lib/api";

const ALLERGIES = [
  "Peanuts",
  "Milk",
  "Eggs",
  "Fish",
  "Sesame",
  "Wheat",
  "Fluoride",
  "Soy",
];

const DIETARY = [
  "Vegetarian",
  "Peanuts",
  "Vegan",
  "Halal",
  "Gluten-free",
  "No sugar",
  "Kosher",
];

function Pill({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: (label: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(label)}
      aria-pressed={selected}
      className={`inline-flex h-12 items-center gap-3 rounded-xl border px-4 text-sm font-medium transition-colors ${
        selected
          ? "border-forest bg-forest text-white"
          : "border-forest bg-white text-forest hover:bg-forest/[0.04]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          selected ? "border-white" : "border-forest"
        }`}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
      {label}
    </button>
  );
}

function PreferenceCard({
  title,
  subtitle,
  options,
  selected,
  onToggle,
}: {
  title: string;
  subtitle: string;
  options: string[];
  selected: Set<string>;
  onToggle: (label: string) => void;
}) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-forest">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={selected.has(option)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

export default function Personalization() {
  const router = useRouter();
  const [allergies, setAllergies] = useState<Set<string>>(new Set());
  const [dietary, setDietary] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  function toggle(set: Set<string>, setter: (next: Set<string>) => void) {
    return (label: string) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      setter(next);
    };
  }

  async function handleSave() {
    setPending(true);
    try {
      await savePreferences({
        allergies: [...allergies],
        dietary: [...dietary],
      });
      router.push("/dashboard");
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-sage">
      <div className="flex flex-col items-start gap-5 px-6 pt-8 lg:px-14 lg:pt-12">
        <Link
          href="/signup"
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

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[3rem] lg:leading-[1.1]">
            Your Preferences
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-forest/70 sm:text-lg">
            Tell us what matters to you so we can give you more relevant
            results.
          </p>
        </div>
      </div>

      <div className="grid flex-1 content-start gap-6 px-6 py-10 lg:grid-cols-2 lg:px-14">
        <PreferenceCard
          title="Allergies"
          subtitle="Select all that apply"
          options={ALLERGIES}
          selected={allergies}
          onToggle={toggle(allergies, setAllergies)}
        />
        <PreferenceCard
          title="Dietary Preferences"
          subtitle="Select all that apply"
          options={DIETARY}
          selected={dietary}
          onToggle={toggle(dietary, setDietary)}
        />
      </div>

      <div className="flex justify-end px-6 pb-10 lg:px-14">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-forest px-8 text-sm font-semibold text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}