import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Baby,
  CheckCircle2,
  Droplets,
  Layers,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Wheat,
} from "lucide-react";

export default function AwarenessSection() {
  return (
    <section className="relative overflow-hidden bg-sage/20 py-20 sm:py-24 lg:py-28 border-y border-forest/10">
      <Container className="relative max-w-6xl">
        <SectionHeading
          eyebrow="Demystifying Everyday Ingredients"
          title="What Are GMOs and Fluoride, Really?"
          subtitle="You shouldn't need a medical degree to know what touches your family. Here is an honest, beginner-friendly look at two common ingredients, why they raise questions, and how Tracee keeps you informed."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Card 1: GMOs (Double-Bezel Architecture) */}
          <div className="group relative rounded-[2rem] border border-forest/10 bg-white/70 p-2.5 shadow-sm ring-1 ring-forest/5 backdrop-blur-xs transition-all duration-300 hover:shadow-xl hover:border-forest/20">
            <div className="flex h-full flex-col justify-between rounded-[1.6rem] bg-white p-6 sm:p-8 border border-forest/5">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-forest/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
                      <Wheat className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">01 &bull; Food & Agriculture</span>
                      <h3 className="text-xl font-bold tracking-tight text-forest sm:text-2xl">
                        Genetically Modified Organisms (GMOs)
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-sage/25 p-4 border border-forest/5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-forest/70">
                    The Plain English Translation
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-forest font-medium">
                    A <span className="font-bold underline decoration-amber-400 decoration-2 underline-offset-2">GMO</span> is any crop whose natural DNA has been manually edited in a laboratory—almost always so industrial crops can survive massive spraying of toxic chemical weedkillers without withering.
                  </p>
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest/80">
                    <SearchCheck className="h-4 w-4 text-forest/70" /> Where it commonly hides:
                  </span>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["Corn Syrup", "Soy Lecithin", "Canola Oil", "Modified Starch", "Cottonseed"].map((item) => (
                      <span key={item} className="rounded-lg border border-forest/10 bg-forest/5 px-2.5 py-1 text-xs font-medium text-forest">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">
                    Why We Create Awareness
                  </span>
                  <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3.5 flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="text-xs">
                      <strong className="text-forest font-bold block">Heavy chemical weedkiller residues</strong>
                      <p className="mt-0.5 text-gray-600 leading-normal">
                        Engineered resistance means crops are sprayed heavily with herbicides like glyphosate, leaving invisible residues in daily breakfast and pantry staples.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3.5 flex items-start gap-3">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="text-xs">
                      <strong className="text-forest font-bold block">Gut & immune unpredictability</strong>
                      <p className="mt-0.5 text-gray-600 leading-normal">
                        Novel synthetic proteins can be unrecognized by human digestive enzymes, frequently triggering unexplained gut irritations or allergy-like immune reactions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl bg-forest/5 px-4 py-3 border border-forest/10">
                <span className="text-xs font-bold text-forest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Tracee GMO Filter
                </span>
                <span className="text-[11px] font-medium text-forest/70">Automatic alias cross-match</span>
              </div>
            </div>
          </div>

          {/* Card 2: Fluoride Toothpaste (Double-Bezel Architecture) */}
          <div className="group relative rounded-[2rem] border border-forest/10 bg-white/70 p-2.5 shadow-sm ring-1 ring-forest/5 backdrop-blur-xs transition-all duration-300 hover:shadow-xl hover:border-forest/20">
            <div className="flex h-full flex-col justify-between rounded-[1.6rem] bg-white p-6 sm:p-8 border border-forest/5">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-forest/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20">
                      <Droplets className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700">02 &bull; Oral Care & Hygiene</span>
                      <h3 className="text-xl font-bold tracking-tight text-forest sm:text-2xl">
                        Fluoride in Everyday Toothpaste
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-sage/25 p-4 border border-forest/5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-forest/70">
                    The Plain English Translation
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-forest font-medium">
                    <span className="font-bold underline decoration-sky-400 decoration-2 underline-offset-2">Fluoride</span> is a mineral compound added to toothpastes to harden enamel against cavities. It is meant for topical contact on teeth only—and was never intended to be ingested into the body.
                  </p>
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest/80">
                    <SearchCheck className="h-4 w-4 text-forest/70" /> Where the hazard lies:
                  </span>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["1450+ PPM Pastes", "Swallowing Toddlers", "Sodium Fluoride", "Stannous Fluoride", "Tap Water Stacking"].map((item) => (
                      <span key={item} className="rounded-lg border border-forest/10 bg-forest/5 px-2.5 py-1 text-xs font-medium text-forest">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-800">
                    Why We Create Awareness
                  </span>
                  <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-3.5 flex items-start gap-3">
                    <Baby className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    <div className="text-xs">
                      <strong className="text-forest font-bold block">Dental Fluorosis in young children</strong>
                      <p className="mt-0.5 text-gray-600 leading-normal">
                        Children under 6 swallow flavored pastes easily. Excess ingested fluoride permanently discolors and weakens enamel, causing permanent chalky spots or pitting.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-3.5 flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    <div className="text-xs">
                      <strong className="text-forest font-bold block">Cumulative bioaccumulation & thyroid strain</strong>
                      <p className="mt-0.5 text-gray-600 leading-normal">
                        Fluoride ingested across toothpaste, mouthwash, and tap water accumulates over decades, putting stress on thyroid regulation and bone mineral density.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl bg-forest/5 px-4 py-3 border border-forest/10">
                <span className="text-xs font-bold text-forest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Tracee Strength Checker
                </span>
                <span className="text-[11px] font-medium text-forest/70">PPM extraction & age-band flags</span>
              </div>
            </div>
          </div>
        </div>
        {/* Editorial Takeaway Bar */}
        <div className="mt-12 overflow-hidden rounded-[2rem] border border-forest/10 bg-gradient-to-r from-forest via-forest to-forest-dark p-7 sm:p-9 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sage">
                <Sparkles className="h-3.5 w-3.5 text-sage" />
                Knowledge is Sovereignty
              </span>
              <h4 className="text-2xl font-bold tracking-tight text-white">
                Awareness empowers you to choose, not fear.
              </h4>
              <p className="text-sm text-sage/80 leading-relaxed">
                Tracee doesn&apos;t tell you what to believe—we translate the cryptic fine print so you can decide what belongs in your body, your shopping basket, and your bathroom cabinet.
              </p>
            </div>
            <Link
              href="/signup"
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-forest transition hover:bg-sage shadow-sm active:scale-[0.98]"
            >
              Start Checking Your Products
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

      </Container>
    </section>
  );
}