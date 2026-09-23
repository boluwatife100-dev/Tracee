import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function CtaBanner() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      <Container className="rounded-[2rem] bg-forest px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-sage/80">
            Tracee
          </span>
          <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
            The average shopper spends 30+ minutes squinting at labels.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-sage/80 sm:text-lg">
            Tracee turns that into a 3-second scan with answers you can trust.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button
              href="/onboarding"
              size="lg"
              className="bg-white text-forest hover:bg-sage"
            >
              Start Free Scan
            </Button>
            <p className="text-sm font-medium text-sage/70">
              100% free during the pilot — no card required
            </p>
          </div>

          <dl className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center gap-1">
              <dt className="order-2 text-xs font-medium text-sage/70">
                ingredients decoded
              </dt>
              <dd className="order-1 text-3xl font-extrabold text-white sm:text-4xl">
                12k+
              </dd>
            </div>
            <div className="flex flex-col items-center gap-1">
              <dt className="order-2 text-xs font-medium text-sage/70">
                plants diagnosed
              </dt>
              <dd className="order-1 text-3xl font-extrabold text-white sm:text-4xl">
                4.5k+
              </dd>
            </div>
            <div className="flex flex-col items-center gap-1">
              <dt className="order-2 text-xs font-medium text-sage/70">
                scans in the pilot
              </dt>
              <dd className="order-1 text-3xl font-extrabold text-white sm:text-4xl">
                30k+
              </dd>
            </div>
          </dl>
        </div>
      </Container>
    </section>
  );
}