import type { ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary";

interface ButtonBaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  type?: never;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  type?: "button" | "submit";
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition-all duration-300 ease-out focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_0_0_1px_rgba(124,106,247,0.4),0_8px_24px_-8px_rgba(124,106,247,0.65)] hover:shadow-[0_0_0_1px_rgba(124,106,247,0.6),0_12px_32px_-6px_rgba(124,106,247,0.85)] hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0",
  secondary:
    "bg-transparent text-text border border-border hover:border-primary/60 hover:bg-surface hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0",
};

export default function Button({
  children,
  variant = "primary",
  className,
  href,
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const classes = cn(base, variants[variant], className);

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
