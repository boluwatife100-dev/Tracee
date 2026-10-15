import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "Login — Tracee",
  description:
    "Log in to Tracee to continue where you left off — your scans and product insights within reach.",
};

export default function LoginPage() {
  return (
    <main className="grid flex-1 min-h-svh lg:grid-cols-2 bg-sage">
      <section className="flex flex-col bg-sage">
        <div className="px-6 pt-6 lg:px-14 lg:pt-10">
          <Logo />
        </div>

        <div className="flex flex-1 items-start px-6 py-12 lg:px-14 lg:py-16 mt-10 lg:mt-20">
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

      <section className="flex h-full w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:min-h-svh lg:py-0 lg:px-0 overflow-hidden">
        <div className="mx-auto flex w-full max-w-md md:max-w-3xl items-center justify-center rounded-lg bg-none md:bg-white  p-4 shadow-none sm:p-8 lg:max-w-4xl lg:p-2 lg:self-stretch lg:shadow-none my-1 lg:my-20">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full flex justify-center",
                cardBox: "w-full max-w-full flex justify-center",
                card: "w-full max-w-full shadow-none sm:shadow-md",
              },
            }}
          />
        </div>
      </section>
    </main>
  );
}