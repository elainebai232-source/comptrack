import type { StoredEditionStatus } from "@/lib/types";

const LABEL: Record<StoredEditionStatus, string> = {
  open: "Open",
  upcoming: "Upcoming",
  closed: "Closed",
  not_announced: "No posting yet",
};

const styles: Record<StoredEditionStatus, string> = {
  open: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  upcoming: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  closed: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  not_announced: "bg-surface text-text-muted ring-border",
};

export function StatusBadge({ status }: { status: StoredEditionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}
