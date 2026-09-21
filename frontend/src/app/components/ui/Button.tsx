import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-primary-700 text-white hover:bg-primary-800",
    secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
    ghost: "text-primary-700 hover:bg-primary-50",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}