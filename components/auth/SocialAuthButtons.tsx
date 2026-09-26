"use client";

import { signInWithProvider } from "@/lib/api";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 01-2.4 3.62v3h3.88c2.27-2.1 3.57-5.18 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 01-4.06 1.16 7.17 7.17 0 01-6.78-4.94H1.28v3.12A12 12 0 0012 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.22 14.32a7.17 7.17 0 010-4.64V6.56H1.28a12 12 0 000 10.88l3.94-3.12z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 001.28 6.56l3.94 3.12A7.17 7.17 0 0112 4.77z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-forest" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 12.52c.04 3.06 2.68 4.08 2.71 4.09-.02.07-.42 1.45-1.4 2.87-.85 1.23-1.74 2.45-3.13 2.48-1.37.03-1.81-.81-3.37-.81-1.57 0-2.06.78-3.36.84-1.35.06-2.37-1.33-3.23-2.55-1.76-2.53-3.1-7.16-1.3-10.29.9-1.55 2.5-2.53 4.24-2.56 1.33-.03 2.58.9 3.39.9.8 0 2.31-1.11 3.89-.94.66.03 2.52.27 3.72 2.01-.1.06-2.22 1.29-2.2 3.86zM14.17 3.67c.7-.85 1.18-2.03 1.05-3.21-.99.04-2.19.65-2.9 1.48-.64.72-1.2 1.89-1.05 3-.98.08-2.06.62-2.9 1.5-.06.06-1.1 1.06-1.07 2.01v.3c.03.91.66 1.89 1.36 2.42.44.34 1.12.62 1.63.59-.1-.44-.15-1.13.05-1.7.12-.33.29-.63.48-.83-.08-.05-.17-.11-.26-.16-1.18-.75-1.93-2.16-1.7-3.82.21-1.49 1.55-2.44 3.24-2.42.12 0 .25.01.38.03z"
      />
    </svg>
  );
}

export default function SocialAuthButtons({
  cta,
}: {
  cta: "Sign up with" | "Log in with";
}) {
  const providers = [
    { label: `${cta} Google`, provider: "google" as const },
    { label: `${cta} Apple`, provider: "apple" as const },
  ];

  async function handleProvider(provider: "google" | "apple") {
    await signInWithProvider(provider);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {providers.map(({ label, provider }) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleProvider(provider)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          {provider === "google" ? <GoogleIcon /> : <AppleIcon />}
          {label}
        </button>
      ))}
    </div>
  );
}