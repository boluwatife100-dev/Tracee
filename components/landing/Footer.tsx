import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How Tracee Works", href: "#how-it-works" },
  { label: "Product Check", href: "#product-check" },
  { label: "Plant Health", href: "#product-check" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", href: "#support" },
  { label: "Contact Us", href: "#support" },
  { label: "Allergy Data", href: "#support" },
  { label: "Privacy Policy", href: "#support" },
];

export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-forest/10 bg-sage pb-10 pt-14 sm:pt-16"
    >
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-gray-600">
              Tracee removes guesswork from everyday consumables and living
              greenery — for safer shopping and healthier plants.
            </p>
            <p className="text-xs font-medium text-gray-500">
              Built for the SHF Final Resolve hackathon.
            </p>
          </div>

          <div id="support" className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest">
              Product
            </h3>
            {PRODUCT_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest">
              Support
            </h3>
            {SUPPORT_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-forest/10 pt-6 sm:flex-row">
          <p className="text-xs font-medium text-gray-500">
            © {new Date().getFullYear()} Tracee. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              aria-label="Tracee on X (Twitter)"
              className="text-gray-500 transition-colors hover:text-forest"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.6 2H8l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Tracee on Instagram"
              className="text-gray-500 transition-colors hover:text-forest"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Tracee on GitHub"
              className="text-gray-500 transition-colors hover:text-forest"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M12 2C6.5 2 2 6.6 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.6 2.4 1.2 3 .9.1-.7.4-1.2.6-1.5-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.2-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 015 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.5.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0022 12c0-5.4-4.5-10-10-10z" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}