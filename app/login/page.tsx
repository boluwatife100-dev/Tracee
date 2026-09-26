import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login — Tracee",
  description:
    "Log in to Tracee to continue where you left off — your scans and product insights within reach.",
};

export default function LoginPage() {
  return (
    <main className="grid flex-1 min-h-[100svh] lg:grid-cols-2">
      <section className="flex flex-col bg-sage">
        <div className="px-6 pt-6 lg:px-14 lg:pt-10">
          <Logo />
        </div>

        <div className="flex flex-1 items-center px-6 py-12 lg:px-14 lg:py-16">
          <div className="flex max-w-md flex-col items-start gap-5">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-forest sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Welcome back!
            </h1>
            <p className="text-base leading-relaxed text-forest/70 sm:text-lg">
              Log in to continue where you left off.
            </p>
            <p className="text-base text-forest sm:text-lg">
              NEW USER?{" "}
              <Link
                href="/signup"
                className="font-semibold text-gold transition-opacity hover:opacity-80"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-16 lg:py-0">
        <LoginForm />
      </section>
    </main>
  );
}