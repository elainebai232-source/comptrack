export type Field = "Quant" | "ML" | "Math" | "Finance" | "CS" | "All";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Season = "Spring" | "Summer" | "Fall" | "Winter" | "Year-round";

export type StoredEditionStatus =
  | "open"
  | "upcoming"
  | "closed"
  | "not_announced";

export interface Organizer {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
}

/** Canonical competition row. Named to avoid clashing with the listing view. */
export interface CompetitionRecord {
  id: string;
  name: string;
  officialUrl: string | null;
  organizerId: string;
  topics: string[];
  teamSizeMin: number | null;
  teamSizeMax: number | null;
  eligibility: string | null;
  prepResourcesUrl: string | null;
  field: Exclude<Field, "All"> | null;
  difficulty: Difficulty | null;
}

export interface Edition {
  id: string;
  competitionId: string;
  season: string;
  status: StoredEditionStatus;
  registrationDeadline: string | null;
  startDate: string | null;
  endDate: string | null;
  usuallyOpens: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  note: string | null;
}

/**
 * Flattened listing shape used by the current homepage and calendar.
 * Built at runtime from Organizer → CompetitionRecord → Edition.
 */
export interface Competition {
  id: string;
  name: string;
  field: Exclude<Field, "All"> | null;
  deadline: string | null;
  difficulty: Difficulty | null;
  tags: string[];
  season: Season;
  /** Real numbers from the record; the card label and filter buckets are derived from these. */
  teamSizeMin: number | null;
  teamSizeMax: number | null;
  /** Effective status on the day the listing was built (see effectiveStatus). */
  status: StoredEditionStatus;
  url?: string;
}
