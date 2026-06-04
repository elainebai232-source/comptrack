"use client";

import { useMemo, useState } from "react";
import { competitions } from "@/lib/competitions";
import type { Field } from "@/lib/types";
import { useSavedContext } from "@/context/SavedContext";
import { CompetitionCard } from "./CompetitionCard";
import { FieldFilter } from "./FieldFilter";

export function CompetitionGrid() {
  const [field, setField] = useState<Field>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { saved, hydrated } = useSavedContext();

  const filtered = useMemo(() => {
    let list = competitions;
    if (field !== "All") {
      list = list.filter((c) => c.field === field);
    }
    if (showSavedOnly && hydrated) {
      list = list.filter((c) => saved.has(c.id));
    }
    return [...list].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }, [field, showSavedOnly, saved, hydrated]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FieldFilter selected={field} onChange={setField} />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={showSavedOnly}
            onChange={(e) => setShowSavedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface-raised accent-accent"
          />
          Saved only
          {hydrated && saved.size > 0 && (
            <span className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent-hover">
              {saved.size}
            </span>
          )}
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-text-muted">No competitions match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>
      )}
    </div>
  );
}
