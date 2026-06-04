import type { Field } from "@/lib/types";

const styles: Record<Exclude<Field, "All">, string> = {
  Quant: "bg-indigo-500/15 text-indigo-300",
  ML: "bg-emerald-500/15 text-emerald-300",
  Math: "bg-amber-500/15 text-amber-300",
  Finance: "bg-sky-500/15 text-sky-300",
  CS: "bg-rose-500/15 text-rose-300",
};

export function FieldBadge({ field }: { field: Exclude<Field, "All"> }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${styles[field]}`}>
      {field}
    </span>
  );
}
