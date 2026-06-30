type ClassValue = string | number | null | false | undefined;

/**
 * Joins class names, skipping falsy values.
 * Intentionally dependency-free to keep the stack exactly as specified.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
