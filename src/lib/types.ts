export type Field = "Quant" | "ML" | "Math" | "Finance" | "CS" | "All";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Season = "Spring" | "Summer" | "Fall" | "Winter" | "Year-round";

export type TeamSize = "Solo" | "Team" | "Both";

export type Tier = "Beginner-friendly" | "Competitive" | "Elite";

export type CompetitionTier = 1 | 2 | 3;

export type StoredEditionStatus =
  | "open"
  | "upcoming"
  | "closed"
  | "not_announced";

export type EditionStatus = StoredEditionStatus | "expired";

export type TeamCategory = TeamSize | "Unknown" | `${number}+`;

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
  tier: CompetitionTier;
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
  field: Exclude<Field, "All">;
  deadline: string;
  difficulty: Difficulty;
  tags: string[];
  season: Season;
  teamSize: TeamSize;
  tier: Tier;
  url?: string;
}

export const FIELDS: Field[] = ["All", "Quant", "ML", "Math", "Finance", "CS"];
