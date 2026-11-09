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
import {
  DEFAULT_FILTERS,
  hiddenNoPostingCount,
  isDefaultFilters,
  matchesTeam,
  parseFilterParams,
  serializeFilterParams,
  teamRange,
  visibleCompetitions,
} from "../src/lib/filters.ts";

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
    teams: [],
    includeUnspecified: false,
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

// Team size: every range type against every bucket.
//                 [min,  max ]   solo   small  large
const teamCases = [
  [[1, 1],       [true,  false, false]],
  [[1, 3],       [true,  true,  false]],
  [[2, null],    [false, true,  true ]],
  [[1, null],    [true,  true,  true ]],
];
const BUCKETS = ["solo", "small", "large"];
for (const [[min, max], expected] of teamCases) {
  BUCKETS.forEach((b, i) => {
    for (const inc of [false, true]) {
      assert.equal(matchesTeam(min, max, [b], inc), expected[i], `${min}–${max} vs ${b}, inc=${inc}`);
    }
  });
  assert.equal(matchesTeam(min, max, [], false), true, `${min}–${max}: no bucket = no filter`);
}
// Unknown size (null–null): hidden unless includeUnspecified; no bucket = no filter.
for (const b of BUCKETS) {
  assert.equal(matchesTeam(null, null, [b], false), false, `null–null vs ${b}, inc off`);
  assert.equal(matchesTeam(null, null, [b], true), true, `null–null vs ${b}, inc on`);
}
assert.equal(matchesTeam(null, null, [], false), true, "null–null, no bucket");
// Several buckets = match any.
assert.equal(matchesTeam(1, 1, ["small", "large"], false), false);
assert.equal(matchesTeam(1, 1, ["solo", "large"], false), true);
assert.deepEqual(teamRange(null, null), null);
assert.deepEqual(teamRange(2, null), { min: 2, max: Infinity });

// includeUnspecified through visibleCompetitions (synthetic null-size card).
const withUnknown = [...nov9, ...listing.map((c) => ({ ...c, status: "open" }))];
const idsU = (opts) =>
  visibleCompetitions(withUnknown, {
    field: "All", teams: [], includeUnspecified: false,
    savedOnly: false, showNoPosting: false, saved: new Set(), ...opts,
  }).map((c) => c.id);
assert.ok(idsU({}).includes("test"), "no bucket: unknown size shows");
assert.ok(!idsU({ teams: ["solo"] }).includes("test"), "bucket + inc off: unknown hidden");
assert.ok(idsU({ teams: ["solo"], includeUnspecified: true }).includes("test"), "bucket + inc on: unknown shows");

// Combined filters on real data (field + team + toggle).
assert.deepEqual(ids({ teams: ["small"] }), ["8", "9"], "small, toggle off");
assert.deepEqual(ids({ teams: ["large"] }), [], "large, toggle off");
assert.deepEqual(ids({ teams: ["large"], showNoPosting: true }), ["2", "3", "6", "7"], "large, toggle on");
assert.deepEqual(ids({ field: "Math", teams: ["solo"] }), ["4", "8", "9"], "Math+solo, off");
assert.deepEqual(ids({ field: "Math", teams: ["solo"], showNoPosting: true }), ["4", "5", "8", "9"], "Math+solo, on");
assert.deepEqual(ids({ field: "Math", teams: ["large"], showNoPosting: true }), [], "Math+large, on");
assert.deepEqual(ids({ field: "Quant", teams: ["large"], showNoPosting: true }), ["2"], "Quant+large, on");
assert.deepEqual(ids({ teams: ["large"], savedOnly: true, saved: new Set(["1", "2"]) }), ["2"], "saved only + team");

// Hidden no-posting count follows the other filters.
const base9 = { field: "All", teams: [], includeUnspecified: false, savedOnly: false, showNoPosting: false, saved: new Set() };
assert.equal(hiddenNoPostingCount(nov9, base9), 6);
assert.equal(hiddenNoPostingCount(nov9, { ...base9, field: "Math" }), 1);
assert.equal(hiddenNoPostingCount(nov9, { ...base9, field: "CS" }), 0);
assert.equal(hiddenNoPostingCount(nov9, { ...base9, showNoPosting: true }), 0);
assert.equal(hiddenNoPostingCount(nov9, { ...base9, savedOnly: true }), 0);

// URL params: round-trip, defaults omitted, invalid values ignored.
const q = (s) => parseFilterParams(new URLSearchParams(s));
assert.deepEqual(q(""), DEFAULT_FILTERS);
assert.equal(serializeFilterParams(DEFAULT_FILTERS), "");
const sample = { field: "Math", teams: ["solo", "small"], includeUnspecified: true, showNoPosting: true };
assert.equal(serializeFilterParams(sample), "field=Math&team=solo,small&unspecified=1&noPosting=1");
assert.deepEqual(q(serializeFilterParams(sample)), sample, "round-trip");
for (const f of ["All", "Quant", "ML", "Math", "Finance", "CS"]) {
  for (const teams of [[], ["large"], ["solo", "large"], ["solo", "small", "large"]]) {
    for (const flags of [[false, false], [true, false], [false, true], [true, true]]) {
      const v = { field: f, teams, includeUnspecified: flags[0], showNoPosting: flags[1] };
      assert.deepEqual(q(serializeFilterParams(v)), v, `round-trip ${JSON.stringify(v)}`);
    }
  }
}
assert.deepEqual(q("field=xyz&team=abc,solo"), { ...DEFAULT_FILTERS, teams: ["solo"] }, "garbage ignored, valid kept");
assert.deepEqual(q("team=large,solo,solo"), { ...DEFAULT_FILTERS, teams: ["solo", "large"] }, "deduped, canonical order");
assert.deepEqual(q("field=math"), { ...DEFAULT_FILTERS, field: "Math" }, "field is case-insensitive");
assert.deepEqual(q("noPosting=yes&unspecified=0&team="), DEFAULT_FILTERS, "bad booleans → false");
assert.deepEqual(q("team=solo%2Csmall"), { ...DEFAULT_FILTERS, teams: ["solo", "small"] }, "encoded comma");
assert.deepEqual(q("savedOnly=1&foo=bar"), DEFAULT_FILTERS, "unknown params ignored");
assert.equal(isDefaultFilters(DEFAULT_FILTERS), true);
assert.equal(isDefaultFilters({ ...DEFAULT_FILTERS, includeUnspecified: true }), false);

// New York date: 2026-11-10 03:00 UTC is still Nov 9 in New York.
assert.equal(todayInNewYork(new Date("2026-11-10T03:00:00Z")), "2026-11-09");

console.log("check-listing: all checks passed");
