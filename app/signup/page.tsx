import Link from "next/link";
import Logo from "@/components/ui/Logo";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Sign Up — Tracee",
  description:
    "Create a Tracee account to save your scans and keep your product insights within reach.",
};

export default function SignupPage() {
  return (
    <main className="grid flex-1 min-h-[100svh] lg:grid-cols-2">
      <section className="flex flex-col bg-sage">
        <div className="px-6 pt-6 lg:px-14 lg:pt-10">
          <Logo />
        </div>

        <div className="flex flex-1 items-center px-6 py-12 lg:px-14 lg:py-16">
          <div className="flex max-w-md flex-col items-start gap-5">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-forest sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Welcome to Tracee!
            </h1>
            <p className="text-base leading-relaxed text-forest/70 sm:text-lg">
              Create an account to save your scans and keep your product
              insights within reach.
            </p>
            <p className="text-base text-forest sm:text-lg">
              Have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-gold transition-opacity hover:opacity-80"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-16 lg:py-0">
        <SignUpForm />
      </section>
    </main>
  );
}