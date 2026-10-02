"use client";

import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  ScanLine,
  Sprout,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Plant", href: "/dashboard/my-plant", icon: Sprout },
  { label: "Scan", href: "/dashboard/scan", icon: ScanLine },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <SidebarRoot>
      <SidebarHeader className="justify-center px-0 lg:justify-start lg:px-5">
        <div className="hidden min-w-0 overflow-hidden lg:block">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    href={item.href}
                    isActive={isActive}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="hidden truncate lg:inline lg:group-data-[collapsed=true]/sidebar:hidden">
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  );
}