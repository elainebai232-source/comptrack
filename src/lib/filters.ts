import type { Competition, Field } from "./types";

// Lives here (not in types.ts) so types.ts stays type-only and the
// check:listing script can import this file under plain Node.
export const FIELDS: Field[] = ["All", "Quant", "ML", "Math", "Finance", "CS"];

// ---------------------------------------------------------------------------
// Team size
// ---------------------------------------------------------------------------

export type TeamBucket = "solo" | "small" | "large";

export const TEAM_BUCKETS: TeamBucket[] = ["solo", "small", "large"];

export const TEAM_BUCKET_LABEL: Record<TeamBucket, string> = {
  solo: "Solo (1)",
  small: "2–3",
  large: "4+",
};

/** A closed range of allowed team sizes; max may be Infinity. */
export interface TeamRange {
  min: number;
  max: number;
}

const BUCKET_RANGE: Record<TeamBucket, TeamRange> = {
  solo: { min: 1, max: 1 },
  small: { min: 2, max: 3 },
  large: { min: 4, max: Infinity },
};

/**
 * The team sizes a competition allows, or null if unknown.
 * - min and max known → [min, max]
 * - min known, max null → [min, ∞)
 * - both null → unknown (null)
 * - min null, max known → [1, max] (same as the card label, teamSizeLabel)
 */
export function teamRange(min: number | null, max: number | null): TeamRange | null {
  if (min === null && max === null) return null;
  return { min: min ?? 1, max: max ?? Infinity };
}

/** Two closed ranges overlap when each one starts before the other ends. */
export function rangesOverlap(a: TeamRange, b: TeamRange): boolean {
  return a.min <= b.max && b.min <= a.max;
}

/**
 * - No bucket selected → no team filter (everything passes).
 * - Otherwise a known range must overlap at least one selected bucket;
 *   an unknown range passes only when includeUnspecified is on.
 */
export function matchesTeam(
  min: number | null,
  max: number | null,
  buckets: readonly TeamBucket[],
  includeUnspecified: boolean
): boolean {
  if (buckets.length === 0) return true;
  const range = teamRange(min, max);
  if (range === null) return includeUnspecified;
  return buckets.some((b) => rangesOverlap(range, BUCKET_RANGE[b]));
}

// ---------------------------------------------------------------------------
// Combined homepage filters
// ---------------------------------------------------------------------------

/** Filters that live in the URL (shareable). "Saved only" is not one of them. */
export interface UrlFilters {
  field: Field;
  teams: TeamBucket[];
  includeUnspecified: boolean;
  /** When false (the default), cards whose effective status is not_announced are hidden. */
  showNoPosting: boolean;
}

export const DEFAULT_FILTERS: UrlFilters = {
  field: "All",
  teams: [],
  includeUnspecified: false,
  showNoPosting: false,
};

export interface ListingFilters extends UrlFilters {
  savedOnly: boolean;
  saved: ReadonlySet<string>;
}

/**
 * Which cards the homepage shows. Kept as a pure function so it can be
 * checked by `npm run check:listing` without a browser.
 *
 * - Field and team-size filters always apply.
 * - "Saved only" ignores the default hiding: a saved card always shows.
 * - Otherwise not_announced cards are hidden unless showNoPosting is on.
 */
export function visibleCompetitions(
  list: Competition[],
  f: ListingFilters
): Competition[] {
  return list.filter((c) => {
    if (f.field !== "All" && c.field !== f.field) return false;
    if (!matchesTeam(c.teamSizeMin, c.teamSizeMax, f.teams, f.includeUnspecified)) {
      return false;
    }
    if (f.savedOnly) return f.saved.has(c.id);
    if (!f.showNoPosting && c.status === "not_announced") return false;
    return true;
  });
}

/** How many extra cards turning on "no posting yet" would reveal under the current filters. */
export function hiddenNoPostingCount(list: Competition[], f: ListingFilters): number {
  if (f.savedOnly || f.showNoPosting) return 0;
  return (
    visibleCompetitions(list, { ...f, showNoPosting: true }).length -
    visibleCompetitions(list, f).length
  );
}

export function isDefaultFilters(f: UrlFilters): boolean {
  return (
    f.field === DEFAULT_FILTERS.field &&
    f.teams.length === 0 &&
    f.includeUnspecified === DEFAULT_FILTERS.includeUnspecified &&
    f.showNoPosting === DEFAULT_FILTERS.showNoPosting
  );
}

// ---------------------------------------------------------------------------
// URL query params
//   ?field=Math&team=solo,small&unspecified=1&noPosting=1
// Default values are left out. Unknown or invalid values are ignored.
// ---------------------------------------------------------------------------

/** Anything with .get(), e.g. URLSearchParams or Next's ReadonlyURLSearchParams. */
interface ParamReader {
  get(name: string): string | null;
}

const isTruthyParam = (v: string | null) => v === "1" || v === "true";

export function parseFilterParams(params: ParamReader): UrlFilters {
  const rawField = params.get("field")?.trim().toLowerCase();
  const field = FIELDS.find((f) => f.toLowerCase() === rawField) ?? "All";

  const requested = new Set(
    (params.get("team") ?? "").split(",").map((s) => s.trim().toLowerCase())
  );
  // Keep canonical order and drop anything that isn't a known bucket.
  const teams = TEAM_BUCKETS.filter((b) => requested.has(b));

  return {
    field,
    teams,
    includeUnspecified: isTruthyParam(params.get("unspecified")),
    showNoPosting: isTruthyParam(params.get("noPosting")),
  };
}

/** Query string without the leading "?" ("" when everything is default). */
export function serializeFilterParams(f: UrlFilters): string {
  const params = new URLSearchParams();
  if (f.field !== "All") params.set("field", f.field);
  const teams = TEAM_BUCKETS.filter((b) => f.teams.includes(b));
  if (teams.length > 0) params.set("team", teams.join(","));
  if (f.includeUnspecified) params.set("unspecified", "1");
  if (f.showNoPosting) params.set("noPosting", "1");
  // Keep commas readable in shared links (?team=solo,small).
  return params.toString().replace(/%2C/g, ",");
}
