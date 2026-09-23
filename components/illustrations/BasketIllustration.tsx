export default function BasketIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="A shopping basket of scanned products"
    >
      <ellipse cx="170" cy="296" rx="110" ry="14" fill="#003126" fillOpacity="0.06" />

      <path d="M80 150h180l-14 120a14 14 0 01-14 12H108a14 14 0 01-14-12l-14-120z" fill="#003126" />
      <path d="M96 168h148l-12 96a14 14 0 01-14 12H122a14 14 0 01-14-12l-12-96z" fill="#003126" fillOpacity="0.9" />
      <path d="M112 208h116M108 240h120" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="6" strokeLinecap="round" />

      <rect x="124" y="96" width="92" height="70" rx="16" fill="#eaf3de" />
      <rect x="120" y="130" width="100" height="36" rx="10" fill="#003126" />
      <rect x="120" y="130" width="100" height="8" rx="4" fill="#ffffff" fillOpacity="0.25" />
      <path d="M130 108c8-14 24-20 40-18-6-14-24-18-38-12-4 10 0 20 10 26" fill="#003126" />
      <circle cx="252" cy="110" r="22" fill="#003126" />
      <path d="M250 102a30 30 0 018 6" stroke="#003126" strokeWidth="3" fill="none" strokeLinecap="round" />

      <path d="M70 190a34 34 0 0168 0l18 38a10 10 0 01-9 14H61a10 10 0 01-9-14l18-38z" fill="#eaf3de" />
      <path d="M82 214a22 22 0 0144 0" stroke="#003126" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="104" cy="204" r="4" fill="#003126" fillOpacity="0.35" />

      <path d="M120 96l-8-16M224 96l2-18M210 84l2 12" stroke="#003126" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}