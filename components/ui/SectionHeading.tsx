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
    <div className={`flex flex-col gap-4 ${alignClasses} ${className}`}>
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs uppercase tracking-widest font-semibold text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl font-extrabold leading-tight text-forest sm:text-4xl lg:text-[40px] lg:leading-[1.15]">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-base leading-relaxed text-black sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}