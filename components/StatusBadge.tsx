import Icon from "@/components/Icon";
import { contentStatusMeta, type ContentStatus } from "@/lib/c7-data";

// Small lifecycle pill: live (pulsing dot) / upcoming (clock) / completed (check).
export default function StatusBadge({
  status,
  size = "md"
}: {
  status: ContentStatus;
  size?: "sm" | "md";
}) {
  const meta = contentStatusMeta[status];

  return (
    <span className={`status-badge status-badge--${status} status-badge--${size}`}>
      {status === "live" ? (
        <span className="status-dot" aria-hidden="true" />
      ) : (
        <Icon name={status === "upcoming" ? "clock" : "check"} size={size === "sm" ? 12 : 14} />
      )}
      {meta.short}
    </span>
  );
}
