import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Manrope, Geist } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html suppressHydrationWarning
      lang="en"
      className={cn("h-full", "antialiased", manrope.variable, "font-sans", geist.variable)}
    >
      
      <body className="min-h-full flex flex-col bg-white text-forest font-sans" suppressHydrationWarning={true}>
        <ClerkProvider
          signInUrl="/login"
          signInForceRedirectUrl="/auth/sync"
          signUpForceRedirectUrl="/preferences"
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}