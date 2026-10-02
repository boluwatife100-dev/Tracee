import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

import { ArrowRight, Check, ShieldCheck, Sparkles, Zap } from "lucide-react";

const FEATURE_BADGES = [
  { label: "100% Safe", icon: ShieldCheck },
  { label: "Smart Analysis", icon: Sparkles },
  { label: "Quick and Easy", icon: Zap },
];

export default function Hero() {
  return (
    <section className="relative h-[90vh] min-h-155 w-full overflow-hidden bg-[#E9F3DD]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-2 h-[64%] bg-[url('/bg-2.png')] bg-cover bg-no-repeat bg-position-[64%_42%] after:absolute after:inset-0 after:bg-linear-to-b after:from-transparent after:via-transparent after:to-[#E9F3DD] sm:h-[70%] sm:bg-position-[58%_42%] lg:h-[76%] lg:bg-position-[50%_40%]"
      />
      <Container className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-start gap-5 sm:bottom-12 md:bottom-20 lg:flex-row lg:items-end lg:justify-between lg:gap-4 font-manrope w-full">
        <div className="w-full p-5 text-left  lg:p-6 mx-auto">
          <div className="flex flex-col items-start gap-4 sm:gap-5 max-w-3xl  backdrop-blur-xs  py-6 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.04] text-[#003127]  lg:text-6xl">
              Trace what matters.
              <span className="mt-1.5 block">Make informed choices.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-[#003127]/85 sm:text-lg">
              <span className="font-extrabold uppercase tracking-[0.08em] text-[#003127]">
                TRACEE
              </span>{" "}
              brings product checks, personalized concerns, and plant health into
              one simple 3-in-1 platform, giving you full clarity with confidence.
            </p>

            <div className="flex flex-col items-start gap-2.5 min-[420px]:flex-row">
              <Button
                href="/onboarding"
                size="md"
                className="rounded-lg bg-primary px-5 py-4 lg:px-10 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a22]"
              >
                Get Started
              </Button>
              <Button
                href="#how-it-works"
                variant="ghost"
                size="md"
                className="rounded-lg border-primary border py-4  px-5 text-sm font-semibold text-[#003127] shadow-sm transition hover:bg-white/85 flex gap-2 items-center"
              >
                See How It Works <ArrowRight className="w-4 h-4"/>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full justify-around mx-auto gap-3 md:gap-6 lg:w-auto md:justify-start md:ml-6 md:mt-4 lg:mt-0 lg:ml-0 lg:justify-end lg:gap-9.5">
          {FEATURE_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1.5  rounded-2xl border border-white/70 bg-white/80 px-1.5 text-center text-[#003127] shadow-sm backdrop-blur-sm md:h-25 md:w-25"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9f3dd] text-sm font-bold md:h-9 md:w-9 lg:h-10 lg:w-10">
                <badge.icon className="h-4 w-4 lg:h-5 lg:w-5" />
              </span>
              <span className="text-[11px] font-semibold leading-tight md:text-xs lg:text-[13px]">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}