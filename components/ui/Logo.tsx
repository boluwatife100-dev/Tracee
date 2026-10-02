import Image from "next/image";
import Link from "next/link";

export default function Logo({
  href = "/",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Tracee home"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      
     <Image src="/tracee-logo.png" width={1000} height={1000} alt="tracee logo" className="h-fit w-30 object-cover"/>
    </Link>
  );
}