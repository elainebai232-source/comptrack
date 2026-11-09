import { competitionRecords } from "./data/competitions";
import { editions } from "./data/editions";
import { buildListing, todayInNewYork } from "./derived";
import type { Competition } from "./types";

export { organizers } from "./data/organizers";
export { competitionRecords } from "./data/competitions";
export { editions } from "./data/editions";

export const competitions: Competition[] = buildListing(
  competitionRecords,
  editions,
  todayInNewYork()
);
