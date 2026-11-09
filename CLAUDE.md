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
- Status: Organizer/Competition/Edition split done, 7 existing rows migrated.
  COMAP MCM + ICM added as the first real sample data (2026-27 edition).


## How I like to work
- I'm a Math student, still learning web dev — briefly explain *why* when making
  non-obvious choices.
- Before large or multi-file changes, tell me the plan first and wait for my OK.
- Keep changes small and commit-sized; don't rewrite whole files for a small edit.
- When a feature ships or the data model changes, update `README.md` and this file too.
- Big-picture/strategy decisions I make elsewhere; here, focus on implementation.
