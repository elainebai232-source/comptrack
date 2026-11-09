"use client";

import { useMemo, useState } from "react";
import { competitionRecords, editions } from "@/lib/competitions";
import { buildListing } from "@/lib/derived";
import {
  DEFAULT_FILTERS,
  hiddenNoPostingCount,
  isDefaultFilters,
  visibleCompetitions,
  type TeamBucket,
  type UrlFilters,
} from "@/lib/filters";
import { useSavedContext } from "@/context/SavedContext";
import { CompetitionCard } from "./CompetitionCard";
import { FieldFilter } from "./FieldFilter";
import { TeamSizeFilter } from "./TeamSizeFilter";

interface CompetitionGridProps {
  /** "YYYY-MM-DD" in New York, computed on the server (see app/page.tsx). */
  today: string;
  /** Controlled by the URL (CompetitionGridWithUrl). Defaults are used for the Suspense fallback. */
  filters?: UrlFilters;
  /** Receives an updater, like React's setState(prev => next). */
  onFiltersChange?: (update: (prev: UrlFilters) => UrlFilters) => void;
}

const noop = () => {};

export function CompetitionGrid({
  today,
  filters = DEFAULT_FILTERS,
  onFiltersChange = noop,
}: CompetitionGridProps) {
  // "Saved only" stays local: saved items live in each user's browser,
  // so it would make no sense in a shared link.
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { saved, hydrated } = useSavedContext();

  // Built from the server's date, never from the browser clock.
  const listing = useMemo(
    () => buildListing(competitionRecords, editions, today),
    [today]
  );

  const update = (patch: Partial<UrlFilters>) =>
    onFiltersChange((prev) => ({ ...prev, ...patch }));

  const toggleBucket = (bucket: TeamBucket) =>
    onFiltersChange((prev) => ({
      ...prev,
      teams: prev.teams.includes(bucket)
        ? prev.teams.filter((b) => b !== bucket)
        : [...prev.teams, bucket],
    }));

  const listingFilters = useMemo(
    () => ({
      ...filters,
      // Until localStorage is read, act as if "Saved only" were off.
      savedOnly: showSavedOnly && hydrated,
      saved,
    }),
    [filters, showSavedOnly, hydrated, saved]
  );

  const filtered = useMemo(() => {
    const list = visibleCompetitions(listing, listingFilters);
    // ISO dates sort correctly as strings; unknown deadlines go last.
    return [...list].sort((a, b) =>
      (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31")
    );
  }, [listing, listingFilters]);

  const hiddenCount = hiddenNoPostingCount(listing, listingFilters);
  const showNoPostingOn = () => update({ showNoPosting: true });
  const clearAll = () => onFiltersChange(() => DEFAULT_FILTERS);
  const anyActive = !isDefaultFilters(filters);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <FieldFilter selected={filters.field} onChange={(field) => update({ field })} />
          <TeamSizeFilter
            selected={filters.teams}
            includeUnspecified={filters.includeUnspecified}
            onToggleBucket={toggleBucket}
            onIncludeUnspecifiedChange={(includeUnspecified) => update({ includeUnspecified })}
          />
        </div>
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
              checked={filters.showNoPosting}
              onChange={(e) => update({ showNoPosting: e.target.checked })}
              className="h-4 w-4 rounded border-border bg-surface-raised accent-accent"
            />
            Show competitions with no posting yet
          </label>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
        <span>
          Showing {filtered.length} of {listing.length}
        </span>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={showNoPostingOn}
            className="text-xs underline decoration-dotted underline-offset-2 hover:text-text"
          >
            {hiddenCount} hidden (no posting yet)
          </button>
        )}
        {anyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-surface-hover hover:text-text"
          >
            Clear all filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-text-muted">No competitions match these filters.</p>
          {hiddenCount > 0 && (
            <p className="mt-2 text-sm text-text-muted">
              {hiddenCount} with no posting yet {hiddenCount === 1 ? "is" : "are"} hidden —{" "}
              <button
                type="button"
                onClick={showNoPostingOn}
                className="underline underline-offset-2 hover:text-text"
              >
                show them
              </button>
              .
            </p>
          )}
          {anyActive && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text"
            >
              Clear filters
            </button>
          )}
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
