"use client";

import { useMemo, useState } from "react";
import { competitionRecords, editions } from "@/lib/competitions";
import { buildListing } from "@/lib/derived";
import { visibleCompetitions } from "@/lib/filters";
import type { Field } from "@/lib/types";
import { useSavedContext } from "@/context/SavedContext";
import { CompetitionCard } from "./CompetitionCard";
import { FieldFilter } from "./FieldFilter";

interface CompetitionGridProps {
  /** "YYYY-MM-DD" in New York, computed on the server (see app/page.tsx). */
  today: string;
}

export function CompetitionGrid({ today }: CompetitionGridProps) {
  const [field, setField] = useState<Field>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showNoPosting, setShowNoPosting] = useState(false);
  const { saved, hydrated } = useSavedContext();

  // Built from the server's date, never from the browser clock.
  const listing = useMemo(
    () => buildListing(competitionRecords, editions, today),
    [today]
  );

  const filtered = useMemo(() => {
    const list = visibleCompetitions(listing, {
      field,
      // Until localStorage is read, act as if "Saved only" were off.
      savedOnly: showSavedOnly && hydrated,
      showNoPosting,
      saved,
    });
    // ISO dates sort correctly as strings; unknown deadlines go last.
    return [...list].sort((a, b) =>
      (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31")
    );
  }, [listing, field, showSavedOnly, showNoPosting, saved, hydrated]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FieldFilter selected={field} onChange={setField} />
        <div className="flex flex-col gap-2 sm:items-end">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showNoPosting}
              onChange={(e) => setShowNoPosting(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface-raised accent-accent"
            />
            Show competitions with no posting yet
          </label>
        </div>
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
