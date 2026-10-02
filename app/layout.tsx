import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tracee — Scan products & plants with confidence",
  description:
    "Tracee removes guesswork from everyday consumables and living greenery. Scan products and plants to get ingredient breakdowns, safety verdicts, and plant health diagnostics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-forest font-sans">
        <ClerkProvider
          signInForceRedirectUrl="/auth/sync"
          signUpForceRedirectUrl="/preferences"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}