import type {
  Competition,
  CompetitionRecord,
  CompetitionTier,
  Edition,
  Season,
  StoredEditionStatus,
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

/**
 * Today's calendar date in New York as "YYYY-MM-DD".
 * Dates are kept as ISO strings so they compare correctly with < / <=
 * and never shift by a day because of the viewer's time zone.
 */
export function todayInNewYork(now: Date = new Date()): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Status to show for an edition on `today` ("YYYY-MM-DD").
 * Never changes the stored data; old editions keep their dates.
 */
export function effectiveStatus(
  edition: Edition,
  today: string
): StoredEditionStatus {
  const { registrationDeadline, endDate, status } = edition;
  // A deadline equal to today has not passed yet.
  if (registrationDeadline === null || today <= registrationDeadline) {
    return status;
  }
  if (endDate !== null && today <= endDate) return "closed";
  return "not_announced";
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

/** Never drops a card: null fields stay null and the UI decides how to show them. */
export function toCompetitionView(
  record: CompetitionRecord,
  edition: Edition,
  today: string
): Competition {
  const view: Competition = {
    id: record.id,
    name: record.name,
    field: record.field,
    deadline: edition.registrationDeadline,
    difficulty: record.difficulty,
    tags: record.topics,
    // TODO: derive season from real dates (startDate / registrationDeadline);
    // keep usuallyOpens only as a fallback when no dates are known.
    season: academicSeasonFromUsuallyOpens(edition.usuallyOpens),
    teamSize: teamSizeForListing(record.teamSizeMin, record.teamSizeMax),
    tier: tierLabel(record.tier),
    status: effectiveStatus(edition, today),
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

/** One listing entry per competition that has at least one edition. */
export function buildListing(
  records: CompetitionRecord[],
  editions: Edition[],
  today: string
): Competition[] {
  return records.flatMap((record) => {
    const edition = currentEditionFor(record.id, editions);
    return edition ? [toCompetitionView(record, edition, today)] : [];
  });
}
