"use client";

import {
  createContext,
  useContext,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { PanelLeft } from "lucide-react";

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used inside SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setCollapsed((current) => !current);
      return;
    }
    setMobileOpen((current) => !current);
  }

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        mobileOpen,
        toggleSidebar,
        closeMobileSidebar: () => setMobileOpen(false),
      }}
    >
      <div className="flex min-h-[100svh] w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, closeMobileSidebar } = useSidebar();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      <aside
        data-slot="sidebar"
        data-collapsed={collapsed}
        className={`group/sidebar fixed inset-y-0 left-0 z-40 flex w-20 -translate-x-full flex-col border-r border-forest/10 bg-sage transition-[width,transform] duration-200 md:sticky md:top-0 md:h-svh md:translate-x-0 lg:w-64 ${mobileOpen ? "translate-x-0" : ""} ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-header"
      className={`flex h-20 items-center border-b border-forest/10 px-5 ${className}`}
      {...props}
    />
  );
}

export function SidebarContent({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-content"
      className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-6 ${className}`}
      {...props}
    />
  );
}

export function SidebarGroup({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-group"
      className={`flex min-w-0 flex-col gap-2 ${className}`}
      {...props}
    />
  );
}

export function SidebarMenu({
  className = "",
  ...props
}: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={`flex w-full min-w-0 flex-col gap-1.5 ${className}`}
      {...props}
    />
  );
}

export function SidebarMenuItem({
  className = "",
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={`group/menu-item relative ${className}`}
      {...props}
    />
  );
}

export function SidebarMenuButton({
  isActive = false,
  className = "",
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; isActive?: boolean }) {
  return (
    <Link
      href={href}
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={`flex h-11 w-full min-w-0 items-center justify-center gap-3 overflow-hidden rounded-md px-0 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forest lg:group-data-[collapsed=false]/sidebar:justify-start lg:group-data-[collapsed=false]/sidebar:px-3 ${isActive ? "bg-forest text-white" : "text-forest hover:bg-forest/5"} ${className}`}
      {...props}
    />
  );
}

export function SidebarTrigger({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Toggle navigation"
      title="Toggle navigation"
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-md text-forest outline-none transition-colors hover:bg-forest/5 focus-visible:ring-2 focus-visible:ring-forest ${className}`}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft className="size-5" aria-hidden="true" />
    </button>
  );
}

export function SidebarInset({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={`flex min-w-0 flex-1 flex-col bg-white ${className}`}
      {...props}
    />
  );
}