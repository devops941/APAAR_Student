import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  primary: "bg-teal-100 text-teal-700",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusVariantMap: Record<string, BadgeVariant> = {
  VERIFIED: "success",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  REJECTED: "danger",
  CORRECTION_REQUIRED: "warning",
  DRAFT: "default",
  PENDING: "default",
  ACTIVE: "success",
  GRADUATED: "info",
  TRANSFERRED: "warning",
  WITHDRAWN: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariantMap[status] ?? "default";
  const label = status.replace(/_/g, " ");
  return (
    <Badge variant={variant}>
      {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
    </Badge>
  );
}
