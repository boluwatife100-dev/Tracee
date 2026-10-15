"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How Tracee Works", href: "#how-it-works" },
  { label: "Support", href: "#support" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-forest/5 bg-white backdrop-blur">
      <Container className="flex h-16 items-center justify-between sm:h-26">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-gray-700 transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-8 lg:flex">
          <Button className="rounded-lg text-sm px-6 py-4 border-primary border" href="/login" variant="ghost">Sign In</Button>
          <Button className="rounded-lg border text-sm px-6 py-4 bg-primary text-white" href="/signup">Get Started</Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </Container>

      {open ? (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-t border-forest/5 bg-white shadow-lg lg:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-semibold text-gray-700 hover:bg-sage hover:text-forest"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex  gap-3 border-t border-primary/50 py-4">
              <Button href="/login" variant="secondary" className="w-36 hover:text-white hover:bg-primary transition-colors text-center rounded-lg border p-4">Sign In</Button>
              <Button href="/signup" className="w-36 bg-primary/90 hover:text-white hover:bg-primary transition-colors text-center rounded-lg border p-4 text-white">Get Started</Button>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}