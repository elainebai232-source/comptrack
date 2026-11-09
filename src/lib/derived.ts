import type {
  Competition,
  CompetitionRecord,
  CompetitionTier,
  Edition,
  EditionStatus,
  Season,
  TeamCategory,
  TeamSize,
  Tier,
} from "./types";

const MONTH_TO_SEASON: Record<string, Season> = {
  Jan: "Winter",
  Feb: "Winter",
  Mar: "Spring",
  Apr: "Spring",
  May: "Spring",
  Jun: "Summer",
  Jul: "Summer",
  Aug: "Summer",
  Sep: "Fall",
  Oct: "Fall",
  Nov: "Fall",
  Dec: "Winter",
};

const TIER_LABEL: Record<CompetitionTier, Tier> = {
  1: "Elite",
  2: "Competitive",
  3: "Beginner-friendly",
};

export function teamCategory(
  teamSizeMin: number | null,
  teamSizeMax: number | null
): TeamCategory {
  if (teamSizeMin === null && teamSizeMax === null) return "Unknown";

  if (teamSizeMax === null && teamSizeMin !== null) {
    return `${teamSizeMin}+`;
  }

  const min = teamSizeMin ?? 1;
  const max = teamSizeMax as number;

  if (min === 1 && max === 1) return "Solo";
  if (min === 1 && max > 1) return "Both";
  return "Team";
}

export function teamSizeForListing(
  teamSizeMin: number | null,
  teamSizeMax: number | null
): TeamSize | null {
  const category = teamCategory(teamSizeMin, teamSizeMax);
  if (category === "Unknown") return null;
  if (category === "Solo" || category === "Team" || category === "Both") {
    return category;
  }

  const min = Number.parseInt(category, 10);
  if (min <= 1) return "Both";
  return "Team";
}

export function isEditionExpired(
  edition: Edition,
  now: Date = new Date()
): boolean {
  const deadline = edition.registrationDeadline ?? edition.endDate;
  if (!deadline) return false;
  const end = new Date(deadline + "T23:59:59");
  return end.getTime() < now.getTime();
}

export function editionStatus(
  edition: Edition,
  now: Date = new Date()
): EditionStatus {
  if (isEditionExpired(edition, now)) return "expired";
  return edition.status;
}

export function academicSeasonFromUsuallyOpens(
  usuallyOpens: string | null
): Season {
  if (!usuallyOpens) return "Year-round";
  return MONTH_TO_SEASON[usuallyOpens] ?? "Year-round";
}

export function tierLabel(tier: CompetitionTier): Tier {
  return TIER_LABEL[tier];
}

export function toCompetitionView(
  record: CompetitionRecord,
  edition: Edition
): Competition | null {
  if (!record.field || !record.difficulty || !edition.registrationDeadline) {
    return null;
  }

  const teamSize = teamSizeForListing(record.teamSizeMin, record.teamSizeMax);
  if (!teamSize) return null;

  const view: Competition = {
    id: record.id,
    name: record.name,
    field: record.field,
    deadline: edition.registrationDeadline,
    difficulty: record.difficulty,
    tags: record.topics,
    season: academicSeasonFromUsuallyOpens(edition.usuallyOpens),
    teamSize,
    tier: tierLabel(record.tier),
  };

  if (record.officialUrl) {
    view.url = record.officialUrl;
  }

  return view;
}

export function currentEditionFor(
  competitionId: string,
  editions: Edition[]
): Edition | undefined {
  const matches = editions.filter((e) => e.competitionId === competitionId);
  if (matches.length === 0) return undefined;
  return [...matches].sort((a, b) => b.season.localeCompare(a.season))[0];
}
