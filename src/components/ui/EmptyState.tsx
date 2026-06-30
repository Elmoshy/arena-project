import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-20 text-center">
      <div className="grid grid-cols-3 gap-1.5 opacity-40" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-sm bg-muted" />
        ))}
      </div>
      <p className="text-sm font-medium text-muted">{message}</p>
      {action}
    </div>
  );
}
