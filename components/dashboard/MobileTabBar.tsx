"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  History,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  Sprout,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Plant", href: "/dashboard/my-plant", icon: Sprout },
  { label: "Scan", href: "/dashboard/scan", icon: ScanLine },
  { label: "Authenticity", href: "/dashboard/authenticity", icon: ShieldCheck },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-sage shadow-[0_-4px_16px_rgba(0,49,39,0.06)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-md py-2 text-forest outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forest ${
                isActive ? "bg-forest/10 text-forest-dark" : "text-forest/50 hover:bg-forest/5"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span
                aria-hidden="true"
                className={`h-1 w-1 rounded-full ${isActive ? "bg-forest" : "bg-transparent"}`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}