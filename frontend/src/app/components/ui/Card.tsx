import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-gray-100 p-4">{children}</div>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}