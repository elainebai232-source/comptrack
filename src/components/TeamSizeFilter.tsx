import { TEAM_BUCKETS, TEAM_BUCKET_LABEL, type TeamBucket } from "@/lib/filters";

interface TeamSizeFilterProps {
  selected: TeamBucket[];
  includeUnspecified: boolean;
  onToggleBucket: (bucket: TeamBucket) => void;
  onIncludeUnspecifiedChange: (value: boolean) => void;
}

export function TeamSizeFilter({
  selected,
  includeUnspecified,
  onToggleBucket,
  onIncludeUnspecifiedChange,
}: TeamSizeFilterProps) {
  // "Include not specified" only matters once a bucket narrows the list.
  const noBucket = selected.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-text-muted">Team</span>
      {TEAM_BUCKETS.map((bucket) => {
        const isActive = selected.includes(bucket);
        return (
          <button
            key={bucket}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggleBucket(bucket)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "border-accent bg-accent-muted text-accent-hover"
                : "border-border text-text-muted hover:bg-surface-hover hover:text-text"
            }`}
          >
            {TEAM_BUCKET_LABEL[bucket]}
          </button>
        );
      })}
      <label
        className={`ml-1 flex items-center gap-2 text-sm ${
          noBucket ? "cursor-not-allowed text-text-muted/50" : "cursor-pointer text-text-muted"
        }`}
        title={noBucket ? "Select a team size first" : undefined}
      >
        <input
          type="checkbox"
          checked={includeUnspecified}
          disabled={noBucket}
          onChange={(e) => onIncludeUnspecifiedChange(e.target.checked)}
          className="h-4 w-4 rounded border-border bg-surface-raised accent-accent"
        />
        Include not specified
      </label>
    </div>
  );
}
