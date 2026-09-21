import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm",
          "focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}