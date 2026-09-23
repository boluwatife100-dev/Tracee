import Link from "next/link";
import {
  DashboardIcon,
  PlantIcon,
  ScanIcon,
  HistoryIcon,
  ProfileIcon,
} from "@/components/ui/icons";

export type NavKey = "dashboard" | "plant" | "scan" | "history" | "profile";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  key: NavKey;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, key: "dashboard" },
  { label: "My Plant", href: "#", icon: PlantIcon, key: "plant" },
  { label: "Scan", href: "/scan", icon: ScanIcon, key: "scan" },
  { label: "History", href: "/history", icon: HistoryIcon, key: "history" },
  { label: "Profile", href: "/profile", icon: ProfileIcon, key: "profile" },
];

export default function Sidebar({ active = "dashboard" }: { active?: NavKey }) {
  return (
    <nav className="w-16 shrink-0 bg-sage py-8 lg:w-64 lg:px-4">
      <ul className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          const classes = isActive
            ? "bg-forest text-white"
            : "bg-transparent text-forest hover:bg-forest/5";
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors lg:justify-start ${classes}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}