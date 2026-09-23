"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    setPending(true);
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
      <SocialAuthButtons cta="Log in with" />

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-500">OR</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-forest">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="e.g johndoe@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-forest placeholder:text-gray-400 transition-colors focus:border-forest focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-forest">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="············"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-forest placeholder:text-gray-400 transition-colors focus:border-forest focus:outline-none"
          />
        </div>

        <a
          href="#"
          className="-mt-2 self-end text-sm font-medium text-forest transition-opacity hover:opacity-70"
        >
          Forgot password?
        </a>

        {error ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-forest text-sm font-semibold text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}