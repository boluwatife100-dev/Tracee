import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const CAPABILITIES = [
  {
    title: "Product Check",
    description:
      "Scan food, cosmetics, and packaged items to reveal full ingredient breakdowns, GMO likelihood, and certifications.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    ),
  },
  {
    title: "Personalized Concerns",
    description:
      "Set your allergies, sensitivities, and dietary preferences — every result gets filtered and flagged just for you.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Plant Health",
    description:
      "Scan indoor and garden plants to diagnose disease, nutrient deficiency, and watering needs before it's too late.",
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
      <Container className="flex flex-col items-center gap-12 lg:gap-16">
        <SectionHeading
          eyebrow="What Tracee Does"
          title="Everything you need to shop and grow with confidence"
          subtitle="Three smart scans, one simple app — built to protect you, your family, and your plants."
        />

        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <article
              key={capability.title}
              className="flex flex-col gap-5 rounded-3xl border border-forest/5 bg-white p-8 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-sage">
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