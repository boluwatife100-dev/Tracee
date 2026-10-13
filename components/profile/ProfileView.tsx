"use client";

import { useRef, useState } from "react";
import {
  savePreferences,
  type NotificationSettings,
  type UserProfile,
} from "@/lib/api";
import {
  CheckIcon,
  ChevronRightIcon,
  LogOutIcon,
  XIcon,
} from "@/components/ui/icons";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";

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
    key: "gmoWarnings",
    title: "GMO Warnings",
    description: "Show the GMO likelihood check in product reports.",
  },
  {
    key: "fluorideWarnings",
    title: "Fluoride Warnings",
    description: "Show the fluoride label check in product reports.",
  },
  {
    key: "allergenAlerts",
    title: "Allergen Alerts",
    description: "Show how the label matches your saved allergies.",
  },
  {
    key: "dietaryAlerts",
    title: "Dietary Checks",
    description: "Show how the label matches your eating preferences.",
  },
];

const ACCOUNT_ROWS = [

  { label: "App Language", value: "English (UK)" },
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
  const { user } = useUser();
  const { signOut } = useClerk();

  const [allergies, setAllergies] = useState<Set<string>>(
    () => new Set(profile.allergies)
  );
  const [dietary, setDietary] = useState<Set<string>>(
    () => new Set(profile.dietary)
  );
  const preferencesRef = useRef({
    allergies: profile.allergies,
    dietary: profile.dietary,
  });
  const preferenceSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [preferenceSaveError, setPreferenceSaveError] = useState("");

  const [notifications, setNotifications] = useState(profile.notifications);
  const notificationsRef = useRef(profile.notifications);
  const notificationSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [notificationSaveError, setNotificationSaveError] = useState("");

  const initials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase()
    : profile.name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

  const name = user?.fullName || profile.name;
  const email = user?.primaryEmailAddress?.emailAddress || profile.email;

  function toggle(
    setter: (next: Set<string>) => void,
    key: "allergies" | "dietary"
  ) {
    return (label: string) => {
      const next = new Set(preferencesRef.current[key]);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      setter(next);
      const nextArray = Array.from(next);

      const selection = {
        ...preferencesRef.current,
        [key]: nextArray,
      };
      preferencesRef.current = selection;
      setPreferenceSaveError("");
      preferenceSaveQueue.current = preferenceSaveQueue.current
        .catch(() => undefined)
        .then(() => savePreferences(selection))
        .then(() => setPreferenceSaveError(""))
        .catch((error: unknown) => {
          console.error("Failed to save profile preferences", error);
          setPreferenceSaveError(
            "Your selection changed, but it could not be saved. Check your connection and try again."
          );
        });
    };
  }

  function toggleNotification(key: keyof NotificationSettings) {
    const next = {
      ...notificationsRef.current,
      [key]: !notificationsRef.current[key],
    };
    notificationsRef.current = next;
    setNotifications(next);
    setNotificationSaveError("");
    notificationSaveQueue.current = notificationSaveQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (!user) {
          throw new Error("The signed-in profile is not available.");
        }
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            notifications: next,
          },
        });
      })
      .then(() => setNotificationSaveError(""))
      .catch((error: unknown) => {
        console.error("Failed to save product report settings", error);
        setNotificationSaveError(
          "Your selection changed, but it could not be saved. Check your connection and try again."
        );
      });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="flex flex-col gap-7 rounded-3xl border border-forest/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={name}
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-forest text-2xl font-bold text-white">
                {initials}
              </span>
            )}
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-2xl font-bold leading-tight text-forest">
                {name}
              </h1>
              <p className="text-sm text-gray-500">{email}</p>
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
              {Array.from(new Set([...ALLERGEN_OPTIONS, ...Array.from(allergies)])).map((option) => (
                <TogglePill
                  key={option}
                  label={option}
                  selected={allergies.has(option)}
                  onToggle={() =>
                    toggle(setAllergies, "allergies")(option)
                  }
                  variant="allergen"
                />
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("newAllergen") as HTMLInputElement;
                const val = input.value.trim();
                if (val && !allergies.has(val)) {
                  toggle(setAllergies, "allergies")(val);
                }
                form.reset();
              }}
              className="flex items-center gap-2 mt-2"
            >
              <input
                type="text"
                name="newAllergen"
                placeholder="Add other allergen..."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
              <button
                type="submit"
                className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
              >
                Add
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">
              Dietary Preferences
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...DIETARY_OPTIONS, ...Array.from(dietary)])).map((option) => (
                <TogglePill
                  key={option}
                  label={option}
                  selected={dietary.has(option)}
                  onToggle={() => toggle(setDietary, "dietary")(option)}
                  variant="dietary"
                />
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("newDietary") as HTMLInputElement;
                const val = input.value.trim();
                if (val && !dietary.has(val)) {
                  toggle(setDietary, "dietary")(val);
                }
                form.reset();
              }}
              className="flex items-center gap-2 mt-2"
            >
              <input
                type="text"
                name="newDietary"
                placeholder="Add other preference..."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
              <button
                type="submit"
                className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
              >
                Add
              </button>
            </form>
            {preferenceSaveError ? (
              <p className="text-sm text-red-700" role="alert">
                {preferenceSaveError}
              </p>
            ) : null}
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-5">
          <SectionHeading
            title="Product Scan Details"
            subtitle="Choose which checks appear in each product scan report."
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
                  label={`Show ${row.title} in product reports`}
                />
              </div>
            ))}
          </div>
          {notificationSaveError ? (
            <p className="text-sm text-red-700" role="alert">
              {notificationSaveError}
            </p>
          ) : null}
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
              onClick={() => signOut({ redirectUrl: '/' })}
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