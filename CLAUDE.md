# CompTrack — Project Context for Claude Code

## What this is
CompTrack is a competition-tracking website for college students (quant, ML, math, modeling,
case competitions, hackathons…).
Live: https://comptrack-lime.vercel.app · Repo: github.com/elainebai232-source/comptrack
Human-facing overview: `README.md`.

**Mission:** close the information gap so students at small / less-resourced colleges can
find the same competition opportunities as students at large universities.

## Stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, deployed on Vercel.
No backend database yet — bookmarks live in browser localStorage.
Pushing to `main` likely triggers a Vercel production deploy, so check locally
(`npm run dev`) before pushing.

## Background doc
`docs/proposal.md` is a local-only background doc (gitignored, never commit it or copy
its contents into tracked files). Read only when the task needs it.
Where it conflicts with this file (e.g. it lists `prize` as a field), **this file wins**.

## Roadmap
- **Nov** — finalize data model; finish core features (filter refinements, calendar polish)  ← CURRENT
- **Dec** — design scraping pipeline; identify & validate target sources; start scraper
- **Jan** — build/test scraper on first sources; map fields to schema; scheduled refresh + expired-listing removal
- **Feb** — monitor data accuracy; expand sources; fix update process
- **Mar** — finish source coverage; peer feedback; refine tagging; final testing; public launch

## Data model decisions (already made — don't relitigate)
- Three layers: **Organizer → Competition → Edition**
  (e.g. COMAP → MCM / ICM / HiMCM → a specific season/year)
- `teamSize`: store real `min` / `max` numbers; filter tags (1 / 2–3 / 4+) are **derived** from them
- `tier`: difficulty/selectivity — 1 = international flagship, 2 = national, 3 = regional / beginner-friendly
- `prize`: **removed on purpose** (students care about reputation, not prize money)
- The listing mapper must tolerate nullable fields; a null field should never make a card disappear.
- Listing `status` is the *effective* status (`effectiveStatus` in `derived.ts`, today in
  America/New_York): deadline null or not passed → stored status; passed but contest not
  over → `closed`; otherwise → `not_announced`. Stored dates are never modified.
  Check with `npm run check:listing`.
- **"Today" comes from the server.** `app/page.tsx` computes `todayInNewYork()` (page
  `revalidate = 3600`) and passes it as a `today` prop; client components build the listing
  from that prop and never call `new Date()` for status. Keeps server/client HTML identical.
- **Homepage visibility** (`visibleCompetitions` in `src/lib/filters.ts`, all pure functions):
  field and team-size filters always apply; `not_announced` cards are hidden unless "Show
  competitions with no posting yet" is on; "Saved only" ignores that hiding (a saved card
  always shows, if it passes field/team).
- **Team-size filter** (multi-select, match any): buckets Solo [1,1], 2–3 [2,3], 4+ [4,∞).
  A competition's range: [min,max]; max null → [min,∞); min null & max known → [1,max];
  both null → unknown. It matches when its range overlaps a selected bucket. No bucket = no
  team filter. Unknown sizes pass only with "Include not specified" (disabled until a bucket
  is selected).
- **URL state**: `?field=Math&team=solo,small&unspecified=1&noPosting=1`
  (`parseFilterParams` / `serializeFilterParams`). Defaults are omitted; unknown/invalid
  values are ignored (valid ones kept); "Saved only" is never in the URL. The URL is the single
  source of truth: `CompetitionGridWithUrl` reads `useSearchParams` inside `<Suspense>` (keeps
  `/` static + hourly revalidate) and writes with `window.history.replaceState` (no history
  entry, no scroll, no server round trip). Updates are computed from the current URL, not the
  last render.
- Result bar: "Showing X of Y" (Y = all competitions); "N hidden (no posting yet)" turns the
  toggle on; "Clear all filters" (only when a URL filter is non-default) resets URL filters but
  not saved items / "Saved only".
- Card display: status badge on every card; "No posting yet" cards show "Last deadline: <date>"
  (or no deadline row if null), never the old date as the current deadline; null team size →
  "Not specified".
- Status: Organizer/Competition/Edition split done, 7 existing rows migrated.
  COMAP MCM + ICM added as the first real sample data (2026-27 edition).

## Known issues / TODO
Keep this list current: add items as they come up, remove them when fixed.
- Calendar (`CalendarView.tsx`) still uses the module-level `competitions` from
  `lib/competitions.ts` (built with the module's own `todayInNewYork()`) and `new Date()` for
  "today" — should take the server `today` prop like the homepage.
- `usuallyOpens` lives on Edition; it should move to Competition (it's a property of the
  competition, not of one season).
- Card `season` is derived from `usuallyOpens`; it should be derived from real dates
  (startDate / registrationDeadline), with `usuallyOpens` only as a fallback.
- The 6 original competitions (ids 1, 2, 3, 5, 6, 7) are placeholder data — replace with real
  current-season data.
- Opening a filtered link (e.g. `/?field=Math&noPosting=1`) briefly shows the default 3 cards
  before the filtered view: the static HTML is the Suspense fallback (default filters), and
  the URL is only read in the browser.
- An invalid link (e.g. `?field=xyz`) keeps its bad params in the address bar until the first
  filter change rewrites the URL (the view itself already ignores them).
- Card "Team" cell still shows the coarse label (Solo / Team / Both); could show the real
  range (e.g. "1–3", "2+") now that min/max are on the listing.

## How I like to work
- I'm a Math student, still learning web dev — briefly explain *why* when making
  non-obvious choices.
- Before large or multi-file changes, tell me the plan first and wait for my OK.
- Keep changes small and commit-sized; don't rewrite whole files for a small edit.
- When a feature ships or the data model changes, update `README.md` and this file too.
- Big-picture/strategy decisions I make elsewhere; here, focus on implementation.
