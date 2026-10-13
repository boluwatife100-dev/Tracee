import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { CircleUser, Package } from "lucide-react";

const CAPABILITIES = [
  {
    title: "Product Check",
    description:
      "Scan food, cosmetics, and packaged items instantly for ingredients, GMO likelihood, and certifications.",
    icon: <Package/>
  },
  {
    title: "Personalized Concerns",
    description:
      "Set your sensitivities, allergies, and dietary preferences to get tailored alerts and safer alternatives.",
    icon: <CircleUser/>
  },
  {
    title: "Plant Health",
    description:
      "Scan your indoor and garden plants to instantly diagnose disease, deficiency, and optimal watering schedules.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M12 21V10" />
        <path d="M12 10c0-4 3-7 8-7 0 5-3 7-8 7z" />
        <path d="M12 10c0-3-2-5-6-5 0 4 2 5 6 5z" />
      </svg>
    ),
  },
];

export default function WhatTraceeDoes() {
  return (
    <section id="features" className="bg-sage py-16 sm:py-20 lg:py-24">
      <Container className="flex flex-col items-center gap-12 lg:gap-16 max-w-7xl!">
        <SectionHeading
          eyebrow="Core Capabilities"
          title="What Tracee Does"
          subtitle="Tracee is a 3-in-1 platform that eliminates the guesswork across everyday consumables and living greenery."
        />

        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <article
              key={capability.title}
              className="flex flex-col gap-5 rounded-2xl  bg-white p-8 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-primary">
                {capability.icon}
              </div>
              <h3 className="text-xl font-bold text-forest">
                {capability.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}