// Quick sanity check for the listing logic. Run with: npm run check:listing
// Uses Node's built-in TypeScript support and node:assert (no test framework).
import assert from "node:assert/strict";
import { competitionRecords } from "../src/lib/data/competitions.ts";
import { editions } from "../src/lib/data/editions.ts";
import {
  buildListing,
  effectiveStatus,
  todayInNewYork,
} from "../src/lib/derived.ts";
import { visibleCompetitions } from "../src/lib/filters.ts";

const statusById = (today) =>
  Object.fromEntries(
    buildListing(competitionRecords, editions, today).map((c) => [c.id, c.status])
  );

// As of 2026-11-09: the 6 stale editions are not_announced,
// Putnam (Dec 6) and MCM/ICM (Jan 28) keep their stored "open".
let s = statusById("2026-11-09");
for (const id of ["1", "2", "3", "5", "6", "7"]) {
  assert.equal(s[id], "not_announced", `competition ${id} on 2026-11-09`);
}
for (const id of ["4", "8", "9"]) {
  assert.equal(s[id], "open", `competition ${id} on 2026-11-09`);
}

// During the contest window: deadline passed, endDate not yet → closed.
s = statusById("2027-01-30");
assert.equal(s["8"], "closed");
assert.equal(s["9"], "closed");

// After the contest ends → not_announced.
s = statusById("2027-02-02");
assert.equal(s["8"], "not_announced");
assert.equal(s["9"], "not_announced");

// Edge cases on a synthetic edition.
const base = {
  id: "edn-test",
  competitionId: "test",
  season: "2026-27",
  status: "upcoming",
  registrationDeadline: "2027-01-28",
  startDate: null,
  endDate: null,
  usuallyOpens: null,
  sourceUrl: null,
  lastVerifiedAt: null,
  note: null,
};
assert.equal(effectiveStatus(base, "2027-01-28"), "upcoming", "deadline == today is not passed");
assert.equal(effectiveStatus(base, "2027-01-29"), "not_announced", "passed, no endDate");
assert.equal(
  effectiveStatus({ ...base, registrationDeadline: null }, "2099-01-01"),
  "upcoming",
  "null deadline keeps stored status"
);

// A record with difficulty = null (and other null fields) still appears.
const nullRecord = {
  id: "test",
  name: "Null Test",
  officialUrl: null,
  organizerId: "org-test",
  topics: [],
  tier: 3,
  teamSizeMin: null,
  teamSizeMax: null,
  eligibility: null,
  prepResourcesUrl: null,
  field: null,
  difficulty: null,
};
const listing = buildListing(
  [nullRecord],
  [{ ...base, registrationDeadline: null }],
  "2026-11-09"
);
assert.equal(listing.length, 1, "card with null fields must still appear");
assert.equal(listing[0].difficulty, null);

// Real data: all 9 competitions appear.
assert.equal(buildListing(competitionRecords, editions, "2026-11-09").length, 9);

// Homepage visibility (visibleCompetitions) as of 2026-11-09.
const nov9 = buildListing(competitionRecords, editions, "2026-11-09");
const ids = (opts) =>
  visibleCompetitions(nov9, {
    field: "All",
    savedOnly: false,
    showNoPosting: false,
    saved: new Set(),
    ...opts,
  })
    .map((c) => c.id)
    .sort();
assert.deepEqual(ids({}), ["4", "8", "9"], "default hides not_announced");
assert.equal(ids({ showNoPosting: true }).length, 9, "toggle on shows all");
for (const field of ["Quant", "ML", "Math", "Finance", "CS"]) {
  const expectedAll = nov9.filter((c) => c.field === field).map((c) => c.id).sort();
  assert.deepEqual(ids({ field, showNoPosting: true }), expectedAll, `${field}, toggle on`);
  assert.deepEqual(
    ids({ field }),
    expectedAll.filter((id) => ["4", "8", "9"].includes(id)),
    `${field}, toggle off`
  );
}
assert.deepEqual(
  ids({ savedOnly: true, saved: new Set(["1", "8"]) }),
  ["1", "8"],
  "saved only ignores default hiding"
);

// New York date: 2026-11-10 03:00 UTC is still Nov 9 in New York.
assert.equal(todayInNewYork(new Date("2026-11-10T03:00:00Z")), "2026-11-09");

console.log("check-listing: all checks passed");
