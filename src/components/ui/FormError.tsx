interface FormErrorProps {
  message?: string;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400"
    >
      {message}
    </div>
  );
}
