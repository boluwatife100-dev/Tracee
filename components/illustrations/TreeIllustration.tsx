export default function TreeIllustration({
  className = "",
}: {
  className?: string;
}) {
  const foliage: [number, number, number, number][] = [
    [455, 155, 64, 1],
    [398, 120, 52, 1],
    [503, 118, 44, 1],
    [345, 172, 40, 0.95],
    [425, 205, 38, 1],
    [486, 205, 38, 0.95],
    [378, 145, 30, 0.9],
    [535, 150, 30, 0.9],
    [560, 190, 26, 0.9],
    [415, 115, 28, 0.9],
    [318, 235, 34, 0.95],
    [282, 262, 30, 0.9],
    [328, 285, 30, 0.95],
    [362, 258, 26, 0.9],
    [250, 208, 24, 0.9],
    [220, 190, 20, 0.85],
    [565, 245, 40, 0.9],
    [598, 290, 38, 0.85],
    [540, 320, 36, 0.9],
    [620, 335, 34, 0.85],
    [480, 320, 32, 0.9],
    [515, 360, 30, 0.85],
    [455, 365, 34, 0.9],
    [440, 270, 24, 0.85],
    [480, 270, 22, 0.85],
    [418, 105, 26, 0.9],
    [385, 82, 24, 0.9],
    [352, 92, 22, 0.85],
    [360, 130, 20, 0.85],
    [300, 150, 18, 0.85],
    [255, 180, 16, 0.8],
    [280, 225, 18, 0.85],
  ];

  const lightLeaves: [number, number, number][] = [
    [470, 110, -25],
    [420, 208, 15],
    [562, 182, -10],
    [300, 252, -30],
    [602, 332, 20],
    [350, 142, -15],
    [248, 202, -40],
    [502, 362, -20],
    [180, 205, 10],
    [555, 215, -5],
  ];

  return (
    <svg
      viewBox="0 0 640 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="A large tree branch with green leaves sweeping in from the right edge"
    >
      <ellipse cx="360" cy="500" rx="240" ry="12" fill="#003126" fillOpacity="0.05" />

      <path
        d="M648 500c-64-48-128-128-182-202-32-48-42-72-48-100"
        stroke="#003126"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M470 310c-20-38-50-66-90-86"
        stroke="#003126"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M506 336c30-30 60-64 84-88"
        stroke="#003126"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M418 198c-16-30-38-50-68-60"
        stroke="#003126"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M382 224c-22-14-40-26-52-38"
        stroke="#003126"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M590 248c12-14 18-32 20-50"
        stroke="#003126"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M470 310c2 12 0 24-4 34"
        stroke="#003126"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M384 224c-18 14-36 22-54 28"
        stroke="#003126"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M466 298c-18-6-36-8-52-6"
        stroke="#003126"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M418 198c-16-30-38-50-68-60"
        stroke="#003126"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {foliage.map(([cx, cy, r, opacity]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="#003126"
          fillOpacity={opacity}
        />
      ))}

      {lightLeaves.map(([cx, cy, angle]) => (
        <ellipse
          key={`leaf-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          rx={9}
          ry={5.5}
          transform={`rotate(${angle} ${cx} ${cy})`}
          fill="#eaf3de"
          stroke="#003126"
          strokeWidth="1.6"
        />
      ))}
    </svg>
  );
}