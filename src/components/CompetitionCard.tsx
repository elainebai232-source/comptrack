"use client";

import type { Competition } from "@/lib/types";
import { formatDeadline } from "@/lib/date";
import { useSavedContext } from "@/context/SavedContext";
import { DifficultyBadge } from "./DifficultyBadge";
import { FieldBadge } from "./FieldBadge";

interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const { isSaved, toggle, hydrated } = useSavedContext();
  const saved = hydrated && isSaved(competition.id);

  return (
    <article className="group flex flex-col rounded-xl border border-border-subtle bg-surface-raised p-5 transition-all hover:border-border hover:bg-surface-hover">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-text group-hover:text-white">
            {competition.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FieldBadge field={competition.field} />
            <DifficultyBadge difficulty={competition.difficulty} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggle(competition.id)}
          aria-label={saved ? "Remove bookmark" : "Save competition"}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
            saved
              ? "border-accent bg-accent-muted text-accent-hover"
              : "border-border text-text-muted hover:border-border hover:bg-surface-hover hover:text-text"
          }`}
        >
          {saved ? (
            <span className="flex items-center gap-1.5">
              <BookmarkIcon filled />
              Saved
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <BookmarkIcon filled={false} />
              Save
            </span>
          )}
        </button>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-text-muted">Deadline</dt>
          <dd className="mt-0.5 font-medium text-text">
            {formatDeadline(competition.deadline)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Prize</dt>
          <dd className="mt-0.5 font-medium text-text">{competition.prize}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {competition.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-surface px-2 py-0.5 text-xs text-text-muted ring-1 ring-border-subtle"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 1.5}
        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
      />
    </svg>
  );
}
