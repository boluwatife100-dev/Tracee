import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  {
    number: "01",
    title: "Scan",
    description:
      "Point your camera at any product label or plant leaf. Tracee captures everything it needs instantly.",
  },
  {
    number: "02",
    title: "Trace",
    description:
      "We cross-reference ingredients and plant symptoms against trusted databases and your personal profile.",
  },
  {
    number: "03",
    title: "Know",
    description:
      "Get a clear safety verdict, flagged concerns, and smarter alternatives — in plain language you can act on.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
      <Container className="flex flex-col items-center gap-12 lg:gap-16">
        <SectionHeading
          eyebrow="How It Works"
          title="Clear answers in 3 simple steps"
          subtitle="No jargon, no guesswork — just evidence-based clarity from scan to verdict."
        />

        <ol className="grid w-full gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="relative flex flex-col gap-4 rounded-3xl bg-sage p-8"
            >
              <span
                className="text-5xl font-extrabold text-forest/15"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-forest">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
              {step.number !== "03" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-forest/30 sm:block"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              ) : null}
            </li>
          ))}
        </ol>

        <Button href="/onboarding" size="lg">
          Start Your First Scan
        </Button>
      </Container>
    </section>
  );
}