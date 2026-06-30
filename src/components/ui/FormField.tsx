import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormField({
  label,
  error,
  className,
  id,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id ?? inputProps.name;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text">{label}</span>
      <input
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errorId}
        className={cn(
          "rounded-lg border bg-background px-3.5 py-2.5 text-text outline-none transition-colors duration-200 placeholder:text-muted/60 focus:border-primary",
          error ? "border-red-500/60 focus:border-red-500" : "border-border",
          className,
        )}
        {...inputProps}
      />
      {error ? (
        <span id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </span>
      ) : null}
    </label>
  );
}
