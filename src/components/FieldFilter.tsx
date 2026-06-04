import type { Field } from "@/lib/types";
import { FIELDS } from "@/lib/types";

interface FieldFilterProps {
  selected: Field;
  onChange: (field: Field) => void;
}

const fieldColors: Record<Field, string> = {
  All: "border-border text-text-muted hover:border-border hover:text-text",
  Quant: "border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10",
  ML: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  Math: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
  Finance: "border-sky-500/40 text-sky-300 hover:bg-sky-500/10",
  CS: "border-rose-500/40 text-rose-300 hover:bg-rose-500/10",
};

const fieldActive: Record<Field, string> = {
  All: "bg-surface-hover border-border text-text",
  Quant: "bg-indigo-500/20 border-indigo-400 text-indigo-200",
  ML: "bg-emerald-500/20 border-emerald-400 text-emerald-200",
  Math: "bg-amber-500/20 border-amber-400 text-amber-200",
  Finance: "bg-sky-500/20 border-sky-400 text-sky-200",
  CS: "bg-rose-500/20 border-rose-400 text-rose-200",
};

export function FieldFilter({ selected, onChange }: FieldFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-text-muted">Field</span>
      {FIELDS.map((field) => {
        const isActive = selected === field;
        return (
          <button
            key={field}
            type="button"
            onClick={() => onChange(field)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
              isActive ? fieldActive[field] : fieldColors[field]
            }`}
          >
            {field}
          </button>
        );
      })}
    </div>
  );
}
