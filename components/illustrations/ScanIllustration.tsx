export default function ScanIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="A magnifying glass hovering over a product label being scanned"
    >
      <ellipse cx="160" cy="272" rx="110" ry="14" fill="#003126" fillOpacity="0.06" />

      <rect x="42" y="70" width="176" height="128" rx="18" fill="#eaf3de" />
      <rect x="60" y="92" width="140" height="18" rx="9" fill="#003126" fillOpacity="0.85" />
      <rect x="60" y="122" width="100" height="10" rx="5" fill="#003126" fillOpacity="0.35" />
      <rect x="60" y="140" width="124" height="10" rx="5" fill="#003126" fillOpacity="0.22" />
      <rect x="60" y="158" width="84" height="10" rx="5" fill="#003126" fillOpacity="0.22" />
      <rect x="60" y="180" width="120" height="10" rx="5" fill="#003126" />

      <circle cx="196" cy="160" r="62" fill="#003126" fillOpacity="0.08" />
      <circle cx="196" cy="160" r="48" fill="#ffffff" stroke="#003126" strokeWidth="6" />
      <path
        d="M196 132v56M168 160h56"
        stroke="#003126"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M238 202l30 30"
        stroke="#003126"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <circle cx="70" cy="52" r="8" fill="#003126" fillOpacity="0.85" />
      <circle cx="256" cy="60" r="6" fill="#003126" fillOpacity="0.5" />
      <circle cx="120" cy="44" r="5" fill="#eaf3de" />

      <path d="M196 136a4 4 0 100 8 4 4 0 000-8z" fill="#003126" fillOpacity="0.5" />
    </svg>
  );
}