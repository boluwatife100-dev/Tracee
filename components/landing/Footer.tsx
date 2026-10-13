import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#support" },
  { label: "Terms of Service", href: "#support" },
  { label: "Support", href: "#support" },
];

export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-forest/10 bg-sage py-6 sm:py-10 lg:py-14 lg:px-16"
    >
      <Container className="grid grid-cols-1 justify-items-center gap-4 text-center sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:justify-items-stretch sm:gap-6 sm:text-left">
        <Logo className="sm:justify-self-start" />

        <p className="text-xs lg:text-sm text-gray-600 sm:justify-self-center">
          © {new Date().getFullYear()} Tracee Inc. All rights reserved.
        </p>

        <nav
          id="support"
          aria-label="Legal and support"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs lg:text-sm text-gray-600 sm:justify-self-end"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-medium transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}