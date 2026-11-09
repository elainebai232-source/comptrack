import type { Competition, Field } from "./types";

export interface ListingFilters {
  field: Field;
  savedOnly: boolean;
  /** When false (the default), cards whose effective status is not_announced are hidden. */
  showNoPosting: boolean;
  saved: ReadonlySet<string>;
}

/**
 * Which cards the homepage shows. Kept as a pure function so it can be
 * checked by `npm run check:listing` without a browser.
 *
 * - The field filter always applies.
 * - "Saved only" ignores the default hiding: a saved card always shows.
 * - Otherwise not_announced cards are hidden unless showNoPosting is on.
 */
export function visibleCompetitions(
  list: Competition[],
  { field, savedOnly, showNoPosting, saved }: ListingFilters
): Competition[] {
  return list.filter((c) => {
    if (field !== "All" && c.field !== field) return false;
    if (savedOnly) return saved.has(c.id);
    if (!showNoPosting && c.status === "not_announced") return false;
    return true;
  });
}
