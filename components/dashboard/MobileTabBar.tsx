"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  Clock4Icon,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  Sprout,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { isAdminRole, readRole } from "@/lib/admin-role";

interface NavItem {
  label: string;
  mobileLabel: string;
  href: string;
  icon: LucideIcon;
}

const LEFT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", mobileLabel: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Plant", mobileLabel: "Plant", href: "/dashboard/my-plant", icon: Sprout },
  { label: "Authenticity", mobileLabel: "Verify", href: "/dashboard/authenticity", icon: ShieldCheck },
];

const SCAN_ITEM: NavItem = {
  label: "Scan",
  mobileLabel: "Scan",
  href: "/dashboard/scan",
  icon: ScanLine,
};

const RIGHT_NAV_ITEMS: NavItem[] = [
  { label: "History", mobileLabel: "History", href: "/dashboard/history", icon: Clock4Icon },
  { label: "Profile", mobileLabel: "Profile", href: "/dashboard/profile", icon: UserRound },
];

const ADMIN_ITEM: NavItem = {
  label: "Admin review",
  mobileLabel: "Review",
  href: "/admin/review",
  icon: ClipboardList,
};

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = isAdminRole(readRole(user?.publicMetadata));

  const rightItems = isAdmin ? [...RIGHT_NAV_ITEMS, ADMIN_ITEM] : RIGHT_NAV_ITEMS;

  const isScanActive =
    pathname === SCAN_ITEM.href || pathname.startsWith(`${SCAN_ITEM.href}/`);

  const renderStandardItem = (item: NavItem) => {
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
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-forest outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forest ${
          isActive ? "bg-forest/10 font-semibold text-forest-dark" : "text-forest/60 hover:bg-forest/5"
        }`}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span className="text-[10px] font-medium leading-tight">{item.mobileLabel}</span>
        <span
          aria-hidden="true"
          className={`h-1 w-1 rounded-full transition-opacity ${isActive ? "bg-forest opacity-100" : "opacity-0"}`}
        />
      </Link>
    );
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-sage shadow-[0_-4px_20px_rgba(0,49,39,0.08)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative flex items-center justify-between px-2 pt-1 pb-1.5">
        {/* Left items */}
        <div className="flex flex-1 items-center justify-around">
          {LEFT_NAV_ITEMS.map(renderStandardItem)}
        </div>

        {/* Center elevated Scan button */}
        <div className="relative -mt-6 flex flex-col items-center px-2">
          <Link
            href={SCAN_ITEM.href}
            aria-label={SCAN_ITEM.label}
            aria-current={isScanActive ? "page" : undefined}
            className={`group relative flex size-14 items-center justify-center rounded-full bg-forest text-cream shadow-lg ring-4 ring-sage transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest ${
              isScanActive
                ? "shadow-forest/50 ring-forest/20"
                : "shadow-forest/30 hover:scale-105 hover:bg-forest-dark"
            }`}
          >
            <ScanLine
              className={`size-6 transition-transform duration-200 group-hover:scale-110 ${
                isScanActive ? "stroke-[2.5]" : "stroke-2"
              }`}
              aria-hidden="true"
            />
          </Link>
          <span
            className={`mt-1 text-[10px] font-semibold tracking-tight transition-colors ${
              isScanActive ? "text-forest font-bold" : "text-forest/75"
            }`}
          >
            {SCAN_ITEM.mobileLabel}
          </span>
          <span
            aria-hidden="true"
            className={`h-1 w-1 rounded-full transition-opacity ${
              isScanActive ? "bg-forest opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Right items */}
        <div className="flex flex-1 items-center justify-around">
          {rightItems.map(renderStandardItem)}
        </div>
      </div>
    </nav>
  );
}