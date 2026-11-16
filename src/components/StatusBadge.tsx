import type { Status } from "../types/types";

export default function StatusBadge({
  status,
  mode,
  labels,
}: {
  status: Status;
  mode: "staff" | "client";
  labels: Record<Status, string>;
}) {
  const text = mode === "staff" ? labels[status] : labels[status];

  return <span className="tag">{text}</span>;
}
