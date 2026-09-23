import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type CommonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<NonNullable<CommonProps["variant"]>, string> = {
  primary:
    "bg-forest text-white hover:bg-forest-dark active:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
  secondary:
    "border border-forest/20 bg-white text-forest hover:bg-sage hover:border-forest/30",
  ghost: "text-forest hover:bg-sage",
};

const sizeClasses: Record<NonNullable<CommonProps["size"]>, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-sm sm:text-base",
  lg: "h-14 px-8 text-base",
};

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    children,
    ...rest
  } = props;

  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(" ");

  if (props.href) {
    const { href, ...anchorRest } = props;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}