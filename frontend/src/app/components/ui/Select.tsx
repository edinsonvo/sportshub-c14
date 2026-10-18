import { cn } from "@/lib/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm",
          "focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}