import type { Difficulty } from "@/lib/types";

const styles: Record<Difficulty, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  Intermediate: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  Advanced: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
