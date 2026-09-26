import type { ReactNode } from "react";
import Container from "@/components/ui/Container";

export default function FeatureRow({
  eyebrow,
  title,
  body,
  bullets = [],
  illustration,
  flip = false,
  id,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: { text: string }[];
  illustration: ReactNode;
  flip?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white py-16 sm:py-20 lg:py-24">
      <Container
        className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
          flip ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="flex flex-col items-start gap-6">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full bg-sage px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-forest">
              {eyebrow}
            </span>
          ) : null}
          <h2 className="max-w-xl text-3xl font-extrabold leading-tight text-forest sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {title}
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
            {body}
          </p>
          {bullets.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {bullets.map((bullet) => (
                <li
                  key={bullet.text}
                  className="flex items-start gap-3 text-sm font-semibold text-gray-700 sm:text-base"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mt-0.5 h-4 w-4 shrink-0 text-forest"
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
                  {bullet.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {illustration}
        </div>
      </Container>
    </section>
  );
}