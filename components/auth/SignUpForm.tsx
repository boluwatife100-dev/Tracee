"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/lib/api";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      await createAccount({ email, username, password });
      router.push("/preferences");
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  const fields = [
    {
      id: "email",
      label: "Email",
      type: "email",
      placeholder: "e.g johndoe@gmail.com",
      value: email,
      onChange: setEmail,
      autoComplete: "email",
    },
    {
      id: "username",
      label: "Username",
      type: "text",
      placeholder: "input preferred username",
      value: username,
      onChange: setUsername,
      autoComplete: "username",
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      placeholder: "············",
      value: password,
      onChange: setPassword,
      autoComplete: "new-password",
    },
    {
      id: "confirm-password",
      label: "Confirm Password",
      type: "password",
      placeholder: "············",
      value: confirmPassword,
      onChange: setConfirmPassword,
      autoComplete: "new-password",
    },
  ] as const;

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
      <SocialAuthButtons cta="Sign up with" />

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-500">OR</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-2">
            <label
              htmlFor={field.id}
              className="text-sm font-medium text-forest"
            >
              {field.label}
            </label>
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              autoComplete={field.autoComplete}
              required
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-forest placeholder:text-gray-400 transition-colors focus:border-forest focus:outline-none"
            />
          </div>
        ))}

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
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}