# CompTrack Data Model

This document describes the data structure that is **currently in the code**.
Planned changes are listed separately in Section 7 and are not mixed into the current state.
Keep this file in sync whenever the data model changes.

---

## 0. Overview

```
Organizer                     src/lib/data/organizers.ts
  └─ Competition              src/lib/data/competitions.ts   (links to Organizer via organizerId)
       └─ Edition             src/lib/data/editions.ts       (links to Competition via competitionId)
                │
                ▼  built at runtime (src/lib/derived.ts → buildListing)
       Listing view — one card per competition (type `Competition` in types.ts; never stored)
```

- **Organizer**: who runs it (e.g. COMAP).
- **Competition**: what does not change from year to year (e.g. MCM).
- **Edition**: one specific year or season of a competition (e.g. MCM 2026-27).

Two kinds of data live **outside** these three layers: users' saved competitions (browser storage) and filter settings (URL). See Section 4.

Rules:
- Optional fields are always present and set to `null` when unknown. They are never left out.
- Values that can be computed are not stored. This covers expiry status, team-size labels and the card's term.
- Dates are stored as `"YYYY-MM-DD"` strings and compared in America/New_York time.

When the database is added (planned for February), each layer becomes one table and the id links stay the same.

---

## 1. Organizer

| Field | Type | Nullable | Meaning | Shown on card |
|---|---|---|---|---|
| `id` | string | no | Primary key, e.g. `"org-comap"` | no |
| `name` | string | no | Organizer name | no |
| `website` | string | yes | Official website | no |
| `description` | string | yes | Short description | no |

Nothing from this layer is displayed yet.

---

## 2. Competition (stable across years)

| Field | Type | Nullable | Meaning | Shown on card |
|---|---|---|---|---|
| `id` | string | no | Primary key | no (used as the bookmark key) |
| `name` | string | no | Competition name | title |
| `officialUrl` | string | yes | Official competition page | no (passed to the view, not rendered yet) |
| `organizerId` | string | no | → `Organizer.id` | no |
| `topics` | string[] | no (may be empty) | What the competition covers | topic chips at the bottom of the card |
| `teamSizeMin` | number | yes | Minimum team size | "Team" cell |
| `teamSizeMax` | number | yes | Maximum team size | "Team" cell |
| `eligibility` | string | yes | Who may enter (free text) | no |
| `prepResourcesUrl` | string | yes | Link to preparation resources | no |
| `field` | enum | yes | `Quant` / `ML` / `Math` / `Data` / `CS` | field badge; no badge if null |
| `difficulty` | enum | yes | `Beginner` / `Intermediate` / `Advanced` | difficulty badge |

Notes:
- `field` is single-valued. The list is **provisional** and will be finalized once real competition data is collected.
- `topics` is free text. There is no fixed vocabulary yet, and topics are not filterable. See Section 8.
- `tier` and `prize` were **removed on purpose**:
  - `tier` was a subjective prestige judgment that no official source provides, so the site should not make it for users.
  - `prize` was dropped because students choose competitions for reputation, not prize money.

---

## 3. Edition (one season of a competition)

| Field | Type | Nullable | Meaning | Shown on card |
|---|---|---|---|---|
| `id` | string | no | Primary key, e.g. `"edn-4-2026-27"` | no |
| `competitionId` | string | no | → `Competition.id` | no |
| `season` | string | no | Academic-year label, format `YYYY-YY`, e.g. `"2026-27"` | no |
| `status` | enum | no | Stored status: `open` / `upcoming` / `closed` / `not_announced` | status badge, after `effectiveStatus` (Section 5) |
| `registrationDeadline` | date | yes | Registration deadline | "Deadline" (or "Last deadline" when no posting yet) |
| `startDate` | date | yes | Contest start | no |
| `endDate` | date | yes | Contest end | no (used in status logic) |
| `usuallyOpens` | month, e.g. `"Oct"` | yes | Month registration usually opens | indirectly: used to compute the card's term |
| `sourceUrl` | string | yes | Page this edition's information came from | no |
| `lastVerifiedAt` | date | yes | Date a person checked this edition against the official source; `null` if never | no |
| `note` | string | yes | Free-text note | no |

The homepage shows each competition's latest edition (`currentEditionFor`), which it picks by sorting `season` as a string. That is why the `YYYY-YY` format is enforced (Section 6).

---

## 4. Data outside the three layers

| What | Where | Notes |
|---|---|---|
| Saved competitions | Browser `localStorage`, key `comptrack-saved`, an array of competition ids | Per browser only. Not in the URL, and not shared across devices. |
| Filter settings | URL: `?field=Math&team=solo,small&unspecified=1&noPosting=1` | Defaults are left out. Invalid values are ignored. "Saved only" is never in the URL. |
| "Today" | Computed once on the server in New York time; the homepage regenerates hourly | On the homepage, the browser never computes its own "today" for status. The calendar page still does (known TODO in CLAUDE.md). |

---

## 5. Computed at runtime (never stored)

`toCompetitionView(record, edition, today)` builds each card:

| Card value | Source | How it is computed |
|---|---|---|
| `name`, `field`, `difficulty`, `topics` | Competition | copied directly |
| `deadline` | `Edition.registrationDeadline` | copied directly |
| `status` | `Edition.status` + dates | `effectiveStatus`, in three cases (below) |
| `term` (shown as "Season": Fall, etc.) | `Edition.usuallyOpens` | month → term (below); `null` or an unrecognized value → `Year-round` |
| Team label | `teamSizeMin/Max` | `teamSizeLabel`, five cases (below) |
| Team-size filter | `teamSizeMin/Max` | buckets Solo [1,1], 2–3, 4+; a competition matches every bucket its range overlaps |
| `url` | `Competition.officialUrl` | included only if present |

How `effectiveStatus` decides:
- No deadline, or the deadline has not passed → the stored status.
- The deadline has passed but the contest has not ended → `closed`.
- Otherwise → `not_announced`.

How `term` maps from the month:
- Sep–Nov → Fall
- Dec–Feb → Winter
- Mar–May → Spring
- Jun–Aug → Summer

How `teamSizeLabel` writes the Team cell:
- min = max → "N"
- min ≠ max → "min–max"
- only min → "N+"
- only max → "1–N" ("1" if N = 1)
- neither → "Not specified"

---

## 6. Data integrity checks

`npm run check:listing` fails with the offending id if any of these is violated:

| Check | Why |
|---|---|
| `Edition.season` is `YYYY-YY` with consecutive years | The latest edition is chosen by string sort, so the format must be uniform. For example, `"26-27"` would sort after `"2027-28"` and an old edition would be shown. |
| Ids are unique in each layer | Bookmarks and list rendering rely on ids. |
| Every `organizerId` and `competitionId` points to an existing row | A broken link would otherwise be silently ignored. |
| Date fields are `null` or a real calendar date in `YYYY-MM-DD` | Dates are compared as text, which only works with zero-padded ISO dates. Impossible dates such as `2026-02-30` are rejected. |

---

## 7. Planned changes

| Change | Layer | When |
|---|---|---|
| Move `usuallyOpens` from Edition to Competition | Edition → Competition | late Nov – Dec |
| Compute the card's term from real dates (`startDate` / `registrationDeadline`), with `usuallyOpens` only as a fallback | runtime logic | late Nov – Dec |
| Replace placeholder rows with 15–20 verified, current competitions | all layers | late Nov |
| Possibly add a registration-fee field (e.g. MCM charges a fee per team, a real barrier for students at small colleges) | Competition or Edition, TBD | after data collection |
| Scraper, database, scheduled refresh and removal of expired listings | all layers | Dec – Feb |

---

## 8. Open questions

1. **Topic vocabulary.** Should `topics` use a fixed list, and should it be filterable? A fixed list is a prerequisite for the scraper to map data onto it. One proposal is that topics describe *subject matter only*, not tools (e.g. Python) or formats (e.g. case study).
2. **Unused fields.** Organizer name, `officialUrl`, `eligibility` and `prepResourcesUrl` are stored but not displayed. Should they go on the card, or on a detail page?
3. **Field list.** Quant / ML / Math / Data / CS is provisional.
4. **Registration fee placement.** If it changes yearly, it belongs on Edition; if it is stable, it belongs on Competition.
