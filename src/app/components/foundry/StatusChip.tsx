import { cn } from "../ui/utils";

type Status = "success" | "warning" | "error" | "info" | "neutral" | "active";

const styles: Record<Status, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-indigo-50 text-indigo-700 border-indigo-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
  active: "bg-indigo-600 text-white border-indigo-600",
};

export function StatusChip({
  status,
  children,
  className,
}: {
  status: Status;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
        styles[status],
        className
      )}
    >
      {children}
    </span>
  );
}