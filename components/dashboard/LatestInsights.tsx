"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  ChevronRightIcon,
  BoxIcon,
  PlantIcon,
} from "@/components/ui/icons";

type ActivityKind = "plant" | "product" | "authenticity";

type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  tag: string | null;
  href: string;
  createdAt: string;
};

type InsightItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tag: string | null;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const KIND_ICONS: Record<ActivityKind, ComponentType<{ className?: string }>> = {
  plant: PlantIcon,
  product: BoxIcon,
  authenticity: ShieldCheck,
};

function formatRelativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

function SkeletonRow() {
  return (
    <li className="flex min-w-0 animate-pulse items-center gap-4 py-4" aria-hidden="true">
      <span className="h-11 w-11 shrink-0 rounded-xl bg-forest/10" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="h-3.5 w-1/3 rounded-full bg-forest/10" />
        <span className="h-3 w-1/2 rounded-full bg-forest/5" />
      </div>
      <span className="h-3 w-12 shrink-0 rounded-full bg-forest/5" />
    </li>
  );
}

function SkeletonList() {
  return (
    <ul
      className="flex flex-col divide-y divide-forest/5"
      aria-label="Loading recent activity"
    >
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </ul>
  );
}

export default function LatestInsights() {
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      const response = await fetch("/api/activity");
      if (!response.ok) {
        throw new Error("Recent activity could not be loaded.");
      }
      const data = (await response.json()) as { items?: ActivityEntry[] };
      if (cancelled || !data.items?.length) return;
      setItems(
        data.items.map((entry) => ({
          id: entry.id,
          title: entry.title,
          detail: entry.detail,
          time: formatRelativeTime(entry.createdAt),
          tag: entry.tag,
          href: entry.href,
          icon: KIND_ICONS[entry.kind],
        }))
      );
    }
    void loadActivity()
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setHistoryError(
            loadError instanceof Error
              ? loadError.message
              : "Recent activity could not be loaded."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex min-w-0 flex-col gap-6 rounded-3xl border border-forest/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-forest">Latest Insights</h2>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-forest/60 transition-colors hover:bg-forest/5 hover:text-forest"
          aria-label="Expand insights"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      {historyError ? (
        <p className="text-xs text-red-700" role="status">{historyError}</p>
      ) : null}
      {historyError ? null : loading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <p className="text-sm text-forest/60">
          No recent activity yet. Scan a product or plant to see it here.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-forest/5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-w-0 items-center gap-4 py-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-semibold text-forest">
                      {item.title}
                    </p>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm text-gray-500">
                        {item.detail}
                      </span>
                      {item.tag ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-sage px-2.5 py-0.5 text-xs font-semibold text-foreground">
                          {item.tag}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-400">
                    {item.time}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}