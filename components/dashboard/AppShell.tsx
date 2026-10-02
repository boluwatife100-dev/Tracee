"use client";

import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import DashboardSidebar from "./Sidebar";
import TopBar from "./TopBar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/my-plant": "My Plant",
  "/dashboard/scan": "Scan",
  "/dashboard/scan/result": "Plant Analysis",
  "/dashboard/scan/product-result": "Product Analysis",
  "/dashboard/history": "Scan History",
  "/dashboard/profile": "User Profile",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <TopBar title={title} />
        <main className="flex-1 bg-white px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}