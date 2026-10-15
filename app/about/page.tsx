import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  HeartHandshake,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Tracee",
  description:
    "Learn about Tracee's mission to bring transparency to consumer products, personalized wellness, and plant health diagnostics.",
};

const STATS = [
  { value: "85K+", label: "Mindful Users" },
  { value: "10M+", label: "Clinical & Botanical Records" },
  { value: "< 200ms", label: "Scan Analysis Speed" },
  { value: "99.2%", label: "Verdict Accuracy Rate" },
];
const CORE_VALUES = [
  {
    icon: ShieldCheck,
    title: "Truth & Evidence First",
    description:
      "We believe you deserve unvarnished truth. Our verdicts are backed by rigorous scientific databases, clinical toxicology research, and verified regulatory standards.",
  },
  {
    icon: Eye,
    title: "Radical Transparency",
    description:
      "No corporate jargon or obscured fine print. We break down complex ingredient lists and hidden additives into clear, actionable health insights.",
  },
  {
    icon: Leaf,
    title: "Holistic Wellbeing",
    description:
      "Health extends from the products you consume to the living spaces and plants you nurture. We connect the dots across everyday life.",
  },
  {
    icon: HeartHandshake,
    title: "User-Centered Privacy",
    description:
      "Your sensitivities, dietary preferences, and scan history remain strictly encrypted and confidential. Your data works solely to safeguard your health.",
  },
];

const PILLARS = [
  {
    title: "Food & Consumables Check",
    description:
      "Instant breakdown of packaged food, beverages, and pantry items. We highlight hidden allergens, additives, sodium thresholds, and GMO indicators so your household stays safe.",
    icon: PackageCheck,
    badge: "Consumable Safety",
  },
  {
    title: "Cosmetic & Chemical Scrutiny",
    description:
      "Detect endocrine disruptors, irritants, fragrances, and banned formulations in skincare and personal hygiene products before you apply them to your body.",
    icon: Sparkles,
    badge: "Clean Beauty",
  },
  {
    title: "Botanical & Plant Diagnostics",
    description:
      "Scan troubled indoor plants or backyard gardens to diagnose nutrient deficiencies, pathogen attacks, and receive immediate watering and recovery schedules.",
    icon: Leaf,
    badge: "Plant Care",
  },
];

const MILESTONES = [
  {
    year: "Our Origin",
    title: "Solving the label confusion",
    description:
      "Tracee was founded out of a shared frustration with misleading packaging labels, hidden allergens, and difficult-to-decode chemical names.",
  },
  {
    year: "Engine Build",
    title: "Cross-referencing 10M+ records",
    description:
      "We integrated optical OCR, botanical herbarium registries, and verified regulatory catalogs into an instant-processing multi-spectral model.",
  },
  {
    year: "Today & Beyond",
    title: "Empowering 85,000+ homes",
    description:
      "From daily grocery shopping to maintaining flourishing houseplants, Tracee is an everyday wellness ally in pockets around the world.",
  },
];


export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-sage/60 py-16 sm:py-20 lg:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-forest/5 blur-2xl sm:h-96 sm:w-96"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-forest/5 blur-2xl sm:h-96 sm:w-96"
          />

          <Container className="relative max-w-6xl">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-xs">
                About Tracee
              </span>

              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight text-forest sm:text-5xl lg:text-6xl">
                Empowering everyday decisions with clarity, safety, and evidence.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-forest/80 sm:text-lg">
                Tracee was built on a simple conviction: you shouldn’t need a chemistry degree
                or a botany doctorate to know whether a product is safe or why your houseplant is
                withering.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  href="/signup"
                  size="md"
                  className="rounded-lg bg-primary px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition"
                >
                  Get Started Free
                </Button>
                <Button
                  href="/#how-it-works"
                  variant="secondary"
                  size="md"
                  className="rounded-lg border-forest/20 bg-white px-6 py-4 text-sm font-semibold text-forest shadow-xs hover:bg-sage flex items-center gap-2"
                >
                  See How It Works <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-16 grid grid-cols-2 gap-4 rounded-3xl border border-forest/10 bg-white p-6 shadow-sm sm:grid-cols-4 sm:p-8">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center text-center p-2"
                >
                  <span className="text-2xl font-extrabold text-forest sm:text-3xl lg:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 text-xs font-medium text-gray-600 sm:text-sm">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Container>
        </section>
        {/* Mission & Story Section */}
        <section className="py-16 sm:py-20 lg:py-24">
          <Container className="grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-sage">
                Our Mission
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-forest sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
                Eliminating the guesswork from what touches your life.
              </h2>
              <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                Modern store shelves are crowded with health claims, certification stamps,
                and cryptic E-numbers. At the same time, keeping houseplants thriving remains a
                guessing game of watering cycles and sunlight requirements.
              </p>
              <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                Tracee combines instant optical text capture with clinical toxicology registries and
                horticultural databases to deliver instant, understandable verdicts — completely
                personalized to your unique allergies and dietary choices.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3 text-sm font-semibold text-forest">
                  <CheckCircle2 className="h-5 w-5 text-forest" />
                  Tailored to your specific sensitivities & health preferences
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-forest">
                  <CheckCircle2 className="h-5 w-5 text-forest" />
                  Science-backed ratings without affiliate bias or sponsored noise
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-forest">
                  <CheckCircle2 className="h-5 w-5 text-forest" />
                  All-in-one companion for food, personal care, and plant wellness
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mx-0">
              <div className="relative overflow-hidden rounded-3xl border border-forest/10 bg-sage/50 p-4 shadow-sm sm:p-6">
                <Image
                  src="/shopconfidence.png"
                  alt="Tracee shop with confidence overview"
                  width={600}
                  height={600}
                  className="h-auto w-full rounded-2xl object-contain"
                  priority
                />
              </div>
            </div>
          </Container>
        </section>

        {/* 3 Pillars / Capabilities */}
        <section className="bg-sage/40 py-16 sm:py-20 lg:py-24">
          <Container className="flex flex-col items-center gap-12 lg:gap-16 max-w-6xl">
            <SectionHeading
              eyebrow="What We Stand For"
              title="A 3-in-1 Platform for Modern Living"
              subtitle="Everything you need to verify, protect, and care for what matters in your home."
            />

            <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="flex flex-col gap-5 rounded-2xl border border-forest/5 bg-white p-8 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-primary">
                        <Icon className="h-7 w-7 text-forest" />
                      </div>
                      <span className="rounded-full bg-sage/80 px-3 py-1 text-xs font-semibold text-forest">
                        {pillar.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-forest">
                      {pillar.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-gray-600">
                      {pillar.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>
        {/* Core Values Section */}
        <section className="py-16 sm:py-20 lg:py-24">
          <Container className="flex flex-col items-center gap-12 lg:gap-16 max-w-6xl">
            <SectionHeading
              eyebrow="Our Principles"
              title="Built on Trust and Integrity"
              subtitle="The core values that guide how we engineer our tools and serve our community."
            />

            <div className="grid w-full gap-6 sm:grid-cols-2">
              {CORE_VALUES.map((val) => {
                const Icon = val.icon;
                return (
                  <div
                    key={val.title}
                    className="flex flex-col gap-4 rounded-2xl border border-forest/10 bg-white p-6 sm:p-8"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage text-forest">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-forest">{val.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                      {val.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Journey / Milestones */}
        <section className="bg-sage/40 py-16 sm:py-20 lg:py-24">
          <Container className="max-w-6xl">
            <SectionHeading
              eyebrow="Our Journey"
              title="How Tracee Came to Life"
              subtitle="From an everyday pain point to a trusted wellness technology."
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {MILESTONES.map((milestone) => (
                <div
                  key={milestone.year}
                  className="relative flex flex-col gap-4 rounded-2xl bg-white p-6 sm:p-8 border border-forest/5 shadow-xs"
                >
                  <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
                    {milestone.year}
                  </span>
                  <h3 className="text-xl font-bold text-forest">{milestone.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {milestone.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA Banner */}
        <section className="p-4 lg:p-8 max-w-7xl mx-auto my-12">
          <Container className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="absolute -left-40 -top-20 h-52 w-52 rounded-full bg-[#77d7df]/10 blur-sm sm:-left-10 sm:h-64 sm:w-64 lg:h-96 lg:w-96" />
            <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-[#77d7df]/10 blur-sm sm:-bottom-20 sm:-right-12 sm:h-64 sm:w-64 lg:h-96 lg:w-96" />

            <div className="relative mx-auto flex flex-col items-center text-center gap-6 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#D2E8D9]/20 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#C0ECD6] backdrop-blur-sm">
                <Users className="h-3.5 w-3.5 text-sage" />
                Join the conscious living movement
              </span>

              <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                Ready to make confident choices every day?
              </h2>

              <p className="text-base leading-relaxed text-sage/80 sm:text-lg">
                Start scanning in seconds. Set your dietary preferences, scan your first item or plant, and unlock total clarity.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button
                  href="/signup"
                  size="lg"
                  className="bg-white text-forest hover:bg-sage px-8 py-4 rounded-2xl font-bold shadow-md"
                >
                  Create Free Account
                </Button>
                <Button
                  href="/login"
                  variant="ghost"
                  size="lg"
                  className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-bold"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </Container>
        </section>


      </main>

      <Footer />
    </>
  );
}
