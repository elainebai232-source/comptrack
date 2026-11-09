import { competitionRecords } from "./data/competitions";
import { editions } from "./data/editions";
import { currentEditionFor, toCompetitionView } from "./derived";
import type { Competition } from "./types";

export { organizers } from "./data/organizers";
export { competitionRecords } from "./data/competitions";
export { editions } from "./data/editions";

export const competitions: Competition[] = competitionRecords.flatMap(
  (record) => {
    const edition = currentEditionFor(record.id, editions);
    if (!edition) return [];
    const view = toCompetitionView(record, edition);
    return view ? [view] : [];
  }
);
