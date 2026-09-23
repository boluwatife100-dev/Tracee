import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import TreeIllustration from "@/components/illustrations/TreeIllustration";

const TRUST_BADGES = [
  { title: "Ingredient-level", caption: "deep breakdowns" },
  { title: "Personalized", caption: "to your allergies" },
  { title: "Plant & product", caption: "diagnostics" },
];

export default function Hero() {
  return (
    <section className="overflow-hidden bg-sage">
      <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-28">
        <div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-forest sm:text-5xl lg:text-[3.5rem]">
              Scan it.{" "}
              <span className="relative inline-block">
                Trace it.
                <svg
                  viewBox="0 0 220 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute -bottom-1 left-0 w-full text-forest"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 9C60 2 160 2 217 8"
                    stroke="#003126"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Know what&apos;s really inside.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
              Tracee removes the guesswork from everyday consumables and living
              greenery — scan products for ingredient breakdowns, safety
              verdicts, and plant health diagnostics in seconds.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/onboarding" size="lg">
              Get Started Free
            </Button>
            <Button href="#how-it-works" variant="secondary" size="lg">
              See How It Works
            </Button>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge.title}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-forest"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="7" fill="#eaf3de" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="#003126"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {badge.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto max-w-md lg:max-w-none lg:w-[132%] lg:-mr-[32%]">
          <TreeIllustration className="w-full" />
        </div>
      </Container>
    </section>
  );
}