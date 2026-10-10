import {
  CircleCheck,
  CircleDashed,
  Clock,
  PackageCheck,
  Timer,
  XCircle,
  Ban,
  CircleAlert,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Status badge — semantic color + icon + text label for accessibility
// (PRD §45: never rely on color alone).
// ---------------------------------------------------------------------------

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
  DRAFT: { label: "Draft", className: "badge-requested", Icon: CircleDashed },
  AVAILABLE: { label: "Available", className: "badge-available", Icon: CircleCheck },
  PARTIALLY_RESERVED: { label: "Partially reserved", className: "badge-partially_reserved", Icon: Timer },
  FULLY_RESERVED: { label: "Fully reserved", className: "badge-fully_reserved", Icon: Timer },
  PICKUP_IN_PROGRESS: { label: "Pickup in progress", className: "badge-pickup_in_progress", Icon: Clock },
  COLLECTED: { label: "Collected", className: "badge-collected", Icon: PackageCheck },
  EXPIRED: { label: "Expired", className: "badge-expired", Icon: CircleAlert },
  CANCELLED: { label: "Cancelled", className: "badge-cancelled", Icon: XCircle },
  NO_SHOW: { label: "No-show", className: "badge-no_show", Icon: Ban },
  RESERVED: { label: "Reserved", className: "badge-reserved", Icon: Timer },
  REQUESTED: { label: "Requested", className: "badge-requested", Icon: CircleDashed },
  PENDING: { label: "Pending", className: "badge-pending", Icon: Clock },
  VERIFIED: { label: "Verified", className: "badge-verified", Icon: CircleCheck },
  REJECTED: { label: "Rejected", className: "badge-rejected", Icon: XCircle },
  SUSPENDED: { label: "Suspended", className: "badge-suspended", Icon: Ban },
};

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const meta = STATUS_META[status] ?? {
    label: status.replace(/_/g, " ").toLowerCase(),
    className: "badge-requested",
    Icon: CircleDashed,
  };
  const Icon = meta.Icon;
  return (
    <span className={`badge ${meta.className} ${size === "md" ? "px-3 py-1 text-sm" : ""}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
