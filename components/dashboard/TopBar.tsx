import Logo from "@/components/ui/Logo";
import { ChevronDownIcon } from "@/components/ui/icons";
import { DEMO_USERNAME } from "@/lib/api";
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function TopBar({ title = "Dashboard" }: { title?: string }) {
  const initials = DEMO_USERNAME.slice(0, 2).toUpperCase();

  const { user } = useUser();

  return (
    <header className="grid h-20 grid-cols-[1fr_auto_1fr] items-center border-b border-forest/5 bg-sage px-6 lg:px-10 sticky top-0 z-10">
      <Logo href="/dashboard" />
      <h1 className="text-lg font-semibold text-forest">{title}</h1>
      <div className="flex items-center justify-end gap-2">
        {/* <button
          type="button"
          className="flex items-center gap-2 rounded-full p-1 text-forest transition-colors hover:bg-forest/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
           <Image src={user?.imageUrl || "/image.png"} alt="Profile Image" width={40} height={40} className="rounded-full object-cover" />
          </span>
          <ChevronDownIcon className="h-4 w-4" />
        </button> */}
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: 40,
                height: 40
              },
            },
          }}
        />
      </div>
    </header>
  );
}
