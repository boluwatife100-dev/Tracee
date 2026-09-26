export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const alignClasses =
    align === "center" ? "mx-auto items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 max-w-2xl ${alignClasses} ${className}`}>
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full bg-sage px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-forest">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-xl text-3xl font-extrabold leading-tight text-forest sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}