"use client";

import { useState } from "react";
import Image from "next/image";
import type { RiskLevel, ScanHistoryItem } from "@/lib/api";
import {
  SearchIcon,
  CheckIcon,
  AlertIcon,
  BoxIcon,
} from "@/components/ui/icons";

const PAGE_SIZE = 6;

type FilterKey = "all" | "verified" | "high-gmo" | "recent";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Products" },
  { key: "verified", label: "Verified Only" },
  { key: "high-gmo", label: "High GMO Risk" },
  { key: "recent", label: "Recent Scans" },
];

const GMO_STYLES: Record<RiskLevel, string> = {
  high: "bg-red-600 text-white",
  medium: "bg-amber-400 text-forest",
  low: "bg-green-600 text-white",
};

function ProductPhoto({ item }: { item: ScanHistoryItem }) {
  if (item.imageUrl) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={`${item.productName} package photo`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex aspect-[4/3] w-full items-center justify-center"
      style={{
        backgroundImage:
          "conic-gradient(#e5e7eb 90deg, #f3f4f6 90deg 180deg, #e5e7eb 180deg 270deg, #f3f4f6 270deg)",
        backgroundSize: "24px 24px",
      }}
      role="img"
      aria-label={`${item.productName} image placeholder`}
    >
      <BoxIcon className="h-10 w-10 text-gray-400/60" />
    </div>
  );
}

function HistoryCard({ item }: { item: ScanHistoryItem }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
      <ProductPhoto item={item} />

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold leading-tight text-forest">
            {item.productName}
          </h3>
          <p className="text-sm text-gray-500">{item.manufacturer}</p>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-forest/5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              NAFDAC REG
            </span>
            <span className="text-sm font-bold text-forest">
              {item.nafdacRegNo}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Scan Date
            </span>
            <span className="text-sm font-bold text-forest">
              {item.scanDate}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {item.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
              <CheckIcon className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
              <AlertIcon className="h-3.5 w-3.5" />
              Unverified
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${GMO_STYLES[item.gmoRisk]}`}
          >
            {item.gmoRisk.toUpperCase()}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function HistoryView({
  items,
  total,
}: {
  items: ScanHistoryItem[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  const filtered = items.filter((item) => {
    const matchesQuery =
      query.trim() === "" ||
      item.productName.toLowerCase().includes(query.trim().toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;

    if (filter === "verified") return item.verified;
    if (filter === "high-gmo") return item.gmoRisk === "high";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);
  const poolTotal = filtered.length === items.length ? total : filtered.length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search saved scans</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search saved scans..."
            className="h-12 w-full rounded-full bg-gray-100 pl-12 pr-4 text-sm font-medium text-forest placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((pill) => {
            const active = filter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(pill.key);
                  setPage(1);
                }}
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-forest text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-forest/20 px-6 py-16 text-center">
          <p className="text-base font-semibold text-forest">
            No saved scans found
          </p>
          <p className="text-sm text-gray-500">
            Try a different search or filter to see more of your history.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-4 border-t border-forest/5 pt-5 sm:flex-row">
        <p className="text-sm text-gray-500">
          Showing {start}-{end} of {poolTotal} saved food analyses
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="inline-flex h-11 items-center rounded-full bg-gray-100 px-5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="inline-flex h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest/90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  );
}