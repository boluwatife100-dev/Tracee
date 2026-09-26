export default function PhoneMockup({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 260 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Phone mockup showing a Tracee product scan result"
    >
      <rect x="20" y="10" width="220" height="400" rx="34" fill="#003126" />
      <rect x="30" y="20" width="200" height="380" rx="26" fill="#ffffff" />
      <rect x="118" y="26" width="24" height="6" rx="3" fill="#003126" fillOpacity="0.25" />
      <rect x="46" y="48" width="168" height="22" rx="11" fill="#eaf3de" />
      <rect x="46" y="82" width="118" height="12" rx="6" fill="#003126" fillOpacity="0.15" />
      <rect x="46" y="102" width="150" height="12" rx="6" fill="#003126" fillOpacity="0.12" />
      <rect x="46" y="122" width="88" height="12" rx="6" fill="#003126" fillOpacity="0.12" />

      <rect x="46" y="150" width="168" height="92" rx="16" fill="#eaf3de" />
      <rect x="60" y="164" width="140" height="64" rx="8" fill="#ffffff" fillOpacity="0.85" />
      <rect x="74" y="176" width="64" height="10" rx="5" fill="#003126" fillOpacity="0.35" />
      <rect x="74" y="192" width="100" height="8" rx="4" fill="#003126" fillOpacity="0.18" />
      <circle cx="178" cy="186" r="14" fill="#003126" />
      <path d="M172 184a6 6 0 11-12 0M174 190a8 8 0 10-16 0" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="124" cy="228" r="6" fill="#003126" fillOpacity="0.8" />
      <circle cx="146" cy="228" r="6" fill="#003126" fillOpacity="0.5" />

      <rect x="46" y="256" width="168" height="16" rx="8" fill="#003126" fillOpacity="0.12" />
      <rect x="46" y="256" width="84" height="16" rx="8" fill="#003126" />

      <rect x="46" y="286" width="168" height="16" rx="8" fill="#003126" fillOpacity="0.12" />
      <rect x="46" y="286" width="120" height="16" rx="8" fill="#003126" />

      <rect x="46" y="316" width="168" height="16" rx="8" fill="#003126" fillOpacity="0.12" />
      <rect x="46" y="316" width="56" height="16" rx="8" fill="#eaf3de" />

      <rect x="46" y="352" width="168" height="36" rx="18" fill="#003126" />
      <path d="M128 368l-10 12 10 8 10-8-10-12z" fill="#ffffff" />
      <path d="M118 374h20" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}