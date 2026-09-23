import Link from "next/link";

export default function PlaceholderPage({
  kicker,
  title,
  description,
  nextHref,
  nextLabel = "Continue",
}: {
  kicker: string;
  title: string;
  description: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <span className="inline-flex items-center rounded-full bg-sage px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-forest">
          {kicker}
        </span>
        <h1 className="text-3xl font-extrabold leading-tight text-forest sm:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed text-forest/70">{description}</p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-8 text-sm font-semibold text-white transition-colors hover:bg-forest-dark"
          >
            {nextLabel}
          </Link>
        ) : null}
        <Link
          href="/"
          className="text-sm font-semibold text-forest/60 transition-colors hover:text-forest"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}