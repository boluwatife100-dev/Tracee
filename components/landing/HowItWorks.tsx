import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { ArrowRightLeft, CheckCircle, HouseHeart } from "lucide-react";
import Image from "next/image";

const STEPS = [
  {
    number: "01",
    title: "Point & Scan",
    description:
      "Frame any product ingredient panel, or troubled plant leaf with your smartphone camera. Auto focus captures optical and textual details in under 200 milliseconds",
      subtext: "Supports OCR, GTIN & Leaf Vision",
      icon: <HouseHeart className="w-4 h-4"/>
  },
  {
    number: "02",
    title: "Cross-Reference",
    description:
      "Tracee immediately compares raw optical data against 10M+ clinical laboratory entries, botanical herbarium registries, and your encrypted health preferences",
      subtext: "Sub-second neutral query processing",
      icon: <ArrowRightLeft className="w-4 h-4"/>
  },
  {
    number: "03",
    title: "Verdict & Action",
    description:
      "Receive clean, unambiguous verdicts, clear green-check safety indicators, personalized allegen notifications, or step-by-step horticultural recovery guides.",
      subtext: "Clear ratings & curated alternatives",
      icon: <CheckCircle className="w-4 h-4"/>
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
      <Container className="flex flex-col items-center gap-12 lg:gap-16 max-w-7xl! px-0 lg:px-8!">
        <SectionHeading
          eyebrow="Zero Complexity"
          title="How It Works in 3 Simple Steps"
          subtitle="Advanced multi-spectral machine learning packaged into an effortless, point-and-tap interface."
        />

        <ol className="grid w-full gap-6 lg:gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="relative flex flex-col gap-4 rounded-2xl bg-sage p-4 md:p-6 lg:p-8"
            >
              <span
                className="text-base lg:text-lg w-12 h-12 font-bold text-white rounded-full bg-primary text-center items-center flex justify-center"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-forest">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
              <div className="flex gap-2 items-center bg-white rounded-xl w-full p-3">
                {step.icon}
                <p className="text-[#151C27] text-sm">{step.subtext}</p>
              </div>
             
            </li>
          ))}
        </ol>

        <Button href="/#onboarding" size="lg" className="px-4.5 py-4 bg-primary text-white font-bold text-sm md:text-base rounded-lg">
          See how it works
        </Button>
      </Container>
    </section>
  );
}