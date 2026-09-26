import Link from "next/link";

export default function Logo({
  href = "/",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Tracee home"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          d="M5 22Q16 18 22 5Q11 9 5 22Z"
          fill="#003126"
        />
        <path
          d="M8 19C11 16 14.5 12.5 18 8"
          stroke="#eaf3de"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-forest">
        Tracee
      </span>
    </Link>
  );
}