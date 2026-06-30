"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  children: ReactNode;
  pendingChildren?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition-all duration-300 ease-out focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-primary text-white shadow-[0_0_0_1px_rgba(124,106,247,0.4),0_8px_24px_-8px_rgba(124,106,247,0.65)] hover:shadow-[0_0_0_1px_rgba(124,106,247,0.6),0_12px_32px_-6px_rgba(124,106,247,0.85)] hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0",
  secondary:
    "bg-transparent text-text border border-border hover:border-primary/60 hover:bg-surface hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0",
};

/** Mirrors Button.tsx's styling but reads pending state from the nearest <form>'s useFormStatus, so it must be rendered inside the <form> it submits. */
export default function SubmitButton({
  children,
  pendingChildren,
  className,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(base, variants[variant], className)}
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          {pendingChildren ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
