// Quick sanity check for the listing logic. Run with: npm run check:listing
// Uses Node's built-in TypeScript support and node:assert (no test framework).
import assert from "node:assert/strict";
import { competitionRecords } from "../src/lib/data/competitions.ts";
import { editions } from "../src/lib/data/editions.ts";
import { organizers } from "../src/lib/data/organizers.ts";
import {
  buildListing,
  effectiveStatus,
  teamSizeLabel,
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

// ---------------------------------------------------------------------------
// Data integrity (real data files). These fail loudly on bad hand-entered data.
// ---------------------------------------------------------------------------

// Edition.season must be "YYYY-YY" with consecutive years (e.g. "2026-27").
// currentEditionFor picks the latest edition by sorting this string, which only
// works if every value has the same shape: e.g. "26-27" sorts after "2027-28"
// (position 2: '6' > '0'), so a malformed old edition would be picked over the
// newer one.
for (const e of editions) {
  const m = /^(\d{4})-(\d{2})$/.exec(e.season);
  assert.ok(m, `edition ${e.id}: season "${e.season}" is not YYYY-YY`);
  const expected = String((Number(m[1]) + 1) % 100).padStart(2, "0");
  assert.equal(m[2], expected, `edition ${e.id}: season "${e.season}" years are not consecutive`);
}

// Ids must be unique per table: bookmarks and React list keys use them, so a
// duplicate would make two cards save/unsave together or render wrongly.
for (const [table, rows] of [
  ["organizers", organizers],
  ["competitions", competitionRecords],
  ["editions", editions],
]) {
  const seen = new Set();
  for (const { id } of rows) {
    assert.ok(!seen.has(id), `${table}: duplicate id "${id}"`);
    seen.add(id);
  }
}

// References must point at real rows: a typo in competitionId silently hides
// that edition, and a bad organizerId breaks anything that shows the organizer.
const organizerIds = new Set(organizers.map((o) => o.id));
for (const c of competitionRecords) {
  assert.ok(organizerIds.has(c.organizerId), `competition ${c.id}: unknown organizerId "${c.organizerId}"`);
}
const competitionIds = new Set(competitionRecords.map((c) => c.id));
for (const e of editions) {
  assert.ok(competitionIds.has(e.competitionId), `edition ${e.id}: unknown competitionId "${e.competitionId}"`);
}

// Dates must be null or a real "YYYY-MM-DD": status logic compares them as
// strings (today <= deadline), which is only correct for zero-padded ISO dates.
// The round-trip through Date also rejects impossible dates like 2026-02-30.
const isIsoDate = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
for (const e of editions) {
  for (const key of ["registrationDeadline", "startDate", "endDate", "lastVerifiedAt"]) {
    const v = e[key];
    assert.ok(v === null || (typeof v === "string" && isIsoDate(v)), `edition ${e.id}: ${key} "${v}" is not null or YYYY-MM-DD`);
  }
}

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
for (const field of ["Quant", "ML", "Math", "Data", "CS"]) {
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
for (const f of ["All", "Quant", "ML", "Math", "Data", "CS"]) {
  for (const teams of [[], ["large"], ["solo", "large"], ["solo", "small", "large"]]) {
    for (const flags of [[false, false], [true, false], [false, true], [true, true]]) {
      const v = { field: f, teams, includeUnspecified: flags[0], showNoPosting: flags[1] };
      assert.deepEqual(q(serializeFilterParams(v)), v, `round-trip ${JSON.stringify(v)}`);
    }
  }
}
assert.deepEqual(q("field=Finance"), DEFAULT_FILTERS, "removed field Finance is ignored");
assert.deepEqual(q("field=Data"), { ...DEFAULT_FILTERS, field: "Data" }, "field=Data parses");
assert.deepEqual(q("field=xyz&team=abc,solo"), { ...DEFAULT_FILTERS, teams: ["solo"] }, "garbage ignored, valid kept");
assert.deepEqual(q("team=large,solo,solo"), { ...DEFAULT_FILTERS, teams: ["solo", "large"] }, "deduped, canonical order");
assert.deepEqual(q("field=math"), { ...DEFAULT_FILTERS, field: "Math" }, "field is case-insensitive");
assert.deepEqual(q("noPosting=yes&unspecified=0&team="), DEFAULT_FILTERS, "bad booleans → false");
assert.deepEqual(q("team=solo%2Csmall"), { ...DEFAULT_FILTERS, teams: ["solo", "small"] }, "encoded comma");
assert.deepEqual(q("savedOnly=1&foo=bar"), DEFAULT_FILTERS, "unknown params ignored");
assert.equal(isDefaultFilters(DEFAULT_FILTERS), true);
assert.equal(isDefaultFilters({ ...DEFAULT_FILTERS, includeUnspecified: true }), false);

// Card team-size label from real min/max.
assert.equal(teamSizeLabel(1, 1), "1", "min = max");
assert.equal(teamSizeLabel(4, 4), "4", "min = max > 1");
assert.equal(teamSizeLabel(1, 3), "1–3", "range uses en dash");
assert.equal(teamSizeLabel(2, null), "2+", "only min");
assert.equal(teamSizeLabel(null, 3), "1–3", "only max → 1–N");
assert.equal(teamSizeLabel(null, 1), "1", "only max = 1");
assert.equal(teamSizeLabel(null, null), "Not specified", "neither");
const labelById = Object.fromEntries(
  nov9.map((c) => [c.id, teamSizeLabel(c.teamSizeMin, c.teamSizeMax)])
);
assert.equal(labelById["8"], "1–3", "MCM");
assert.equal(labelById["9"], "1–3", "ICM");
assert.equal(labelById["4"], "1", "Putnam");
assert.equal(labelById["2"], "2+", "Jane Street");
assert.ok(!("tier" in nov9[0]), "tier removed from listing");

// View naming: term (Fall/Winter/…) and topics, not season/tags.
const putnam = nov9.find((c) => c.id === "4");
assert.equal(putnam.term, "Fall", "Putnam term");
assert.ok(!("season" in putnam) && !("tags" in putnam), "old view names gone");
assert.deepEqual(putnam.topics, competitionRecords.find((r) => r.id === "4").topics);

// New York date: 2026-11-10 03:00 UTC is still Nov 9 in New York.
assert.equal(todayInNewYork(new Date("2026-11-10T03:00:00Z")), "2026-11-09");

console.log("check-listing: all checks passed");
