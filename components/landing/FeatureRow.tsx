import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Button from "../ui/Button";
import { ArrowRightIcon } from "../ui/icons";

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
    <section id={id} className="bg-white py-4">
      <Container
        className={`grid max-w-6xl items-center gap-6 lg:grid-cols-2 lg:gap-10 ${
          flip ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="flex flex-col items-start gap-6">
          
          <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-5xl lg:text-[64px] lg:leading-[1.15]">
            {title}
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
            {body}
          </p>
          <Button className="flex gap-2 items-center border border-primary rounded-2xl px-4 py-2" variant="ghost" href="/about" >
          Learn More
          <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
        
        </div>
        

        <div className="mx-auto w-full max-w-lg lg:mx-0">
          {illustration}
        </div>
      </Container>
    </section>
  );
}