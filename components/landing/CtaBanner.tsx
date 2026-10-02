import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { BadgeCheck } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="p-16 max-w-7xl mx-auto">
      <Container className="relative overflow-hidden rounded-3xl bg-primary px-12 py-12 lg:px-16 lg:py-16">
        <div className="absolute -left-40 -top-20 h-52 w-52 rounded-full bg-[#77d7df]/10 blur-sm sm:-left-10 sm:h-64 sm:w-64 lg:h-96 lg:w-96" />
        <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-[#77d7df]/10 blur-sm sm:-bottom-20 sm:-right-12 sm:h-64 sm:w-64 lg:h-96 lg:w-96" />

        <div className="relative mx-auto flex  flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#D2E8D9]/20 px-3 py-1.5 text-[10px] font-medium tracking-wide text-[#C0ECD6] backdrop-blur-sm sm:text-xs">
           <BadgeCheck className="h-3 w-3 text-sage sm:h-4 sm:w-4" aria-hidden="true" />
            Instant Access • No credit card required
          </span>

          <h2 className="text-3xl font-extrabold leading-[1.05] text-white sm:text-4xl lg:text-[3rem]">
            Ready to trace what matters?
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-sage/80 sm:text-lg">
            Join over 85,000 mindful consumers and gardeners making confident,
            evidence-based choices every day.
          </p>

          <Button
            href="/onboarding"
            size="lg"
            className="bg-white text-forest hover:bg-sage p-3 lg:p-4 rounded-2xl"
          >
            Start Free Scan
          </Button>
        </div>
      </Container>
    </section>
  );
}