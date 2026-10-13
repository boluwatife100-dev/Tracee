import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function AdminHeader({
  pendingCount = 0,
}: {
  pendingCount?: number;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-forest/10 bg-sage">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-3 px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/dashboard" />
          <span className="hidden h-7 items-center rounded-full bg-forest px-3 text-xs font-semibold uppercase tracking-wide text-white sm:inline-flex">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-forest/20 bg-white px-4 text-sm font-semibold text-forest transition-colors hover:bg-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <span
            className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-semibold text-white"
            aria-label={`${pendingCount} scans pending review`}
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">{pendingCount}</span>
            <span className="hidden sm:inline">pending</span>
          </span>

          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: {
                  width: 40,
                  height: 40,
                },
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
