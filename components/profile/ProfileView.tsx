"use client";

import { useState } from "react";
import type { NotificationSettings, UserProfile } from "@/lib/api";
import {
  CheckIcon,
  ChevronRightIcon,
  LogOutIcon,
  XIcon,
} from "@/components/ui/icons";

const ALLERGEN_OPTIONS = [
  "Soy",
  "Nuts",
  "Gluten",
  "Dairy",
  "Shellfish",
  "Fish",
];

const DIETARY_OPTIONS = ["Vegetarian", "Halal", "Vegan", "Kosher"];

const NOTIFICATION_ROWS: {
  key: keyof NotificationSettings;
  title: string;
  description: string;
}[] = [
  {
    key: "scanAlerts",
    title: "Scan Alerts",
    description: "Get notified the moment a new scan is ready to review.",
  },
  {
    key: "gmoWarnings",
    title: "GMO Warnings",
    description: "Alerts when a scanned product shows high GMO likelihood.",
  },
  {
    key: "productRecalls",
    title: "Product Recalls",
    description: "Timely updates about recalled food and cosmetic products.",
  },
];

const ACCOUNT_ROWS = [
  { label: "Change Password", value: null },
  { label: "App Language", value: "English (US)" },
];

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold text-forest">{title}</h2>
      {subtitle ? (
        <p className="text-sm text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-forest/5" />;
}

function TogglePill({
  label,
  selected,
  onToggle,
  variant,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  variant: "allergen" | "dietary";
}) {
  const selectedClasses =
    variant === "allergen"
      ? "bg-red-100 text-red-700"
      : "bg-mint text-forest";
  const Icon = variant === "allergen" ? XIcon : CheckIcon;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        selected
          ? selectedClasses
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {selected ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

function ToggleSwitch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-forest" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ProfileView({ profile }: { profile: UserProfile }) {
  const [allergies, setAllergies] = useState<Set<string>>(
    () => new Set(profile.allergies)
  );
  const [dietary, setDietary] = useState<Set<string>>(
    () => new Set(profile.dietary)
  );
  const [notifications, setNotifications] = useState(profile.notifications);

  const initials = profile.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  function toggleNotification(key: keyof NotificationSettings) {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="flex flex-col gap-7 rounded-3xl border border-forest/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-forest text-2xl font-bold text-white">
              {initials}
            </span>
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-2xl font-bold leading-tight text-forest">
                {profile.name}
              </h1>
              <p className="text-sm text-gray-500">{profile.email}</p>
              {profile.premiumMember ? (
                <span className="mt-1 inline-flex items-center rounded-full bg-mint px-3 py-1 text-xs font-medium text-forest">
                  PREMIUM MEMBER
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center rounded-full border border-forest px-5 text-sm font-semibold text-forest transition-colors hover:bg-forest/5"
          >
            Edit Profile
          </button>
        </div>

        <Divider />

        <div className="flex flex-col gap-7">
          <SectionHeading
            title="Allergen & Dietary Preferences"
            subtitle="These help Tracee flag ingredients that matter to you."
          />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">
              Your Allergens
            </p>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((option) => (
                <TogglePill
                  key={option}
                  label={option}
                  selected={allergies.has(option)}
                  onToggle={() =>
                    toggle(allergies, setAllergies)(option)
                  }
                  variant="allergen"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">
              Dietary Preferences
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((option) => (
                <TogglePill
                  key={option}
                  label={option}
                  selected={dietary.has(option)}
                  onToggle={() => toggle(dietary, setDietary)(option)}
                  variant="dietary"
                />
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-5">
          <SectionHeading
            title="Notification Settings"
            subtitle="Choose which alerts you want to receive from Tracee."
          />

          <div className="flex flex-col divide-y divide-forest/5">
            {NOTIFICATION_ROWS.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-forest">
                    {row.title}
                  </p>
                  <p className="text-sm text-gray-500">{row.description}</p>
                </div>
                <ToggleSwitch
                  on={notifications[row.key]}
                  onToggle={() => toggleNotification(row.key)}
                  label={`${row.title} notifications`}
                />
              </div>
            ))}
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-4">
          <SectionHeading title="Account Management" />

          <div className="flex flex-col gap-2.5">
            {ACCOUNT_ROWS.map((row) => (
              <button
                key={row.label}
                type="button"
                className="flex h-12 items-center justify-between rounded-xl bg-gray-100 px-4 text-sm font-semibold text-forest transition-colors hover:bg-gray-200"
              >
                <span>{row.label}</span>
                <span className="flex items-center gap-2">
                  {row.value ? (
                    <span className="text-sm font-medium text-gray-500">
                      {row.value}
                    </span>
                  ) : null}
                  <ChevronRightIcon className="h-4 w-4 text-forest/50" />
                </span>
              </button>
            ))}

            <button
              type="button"
              className="flex h-12 items-center justify-between rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <span>Sign Out Account</span>
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}