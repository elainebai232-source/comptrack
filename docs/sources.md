# Source reconnaissance (Week 3)

Research notes for the future scraper. **Nothing here is verified data.** No data file or
`lastVerifiedAt` was changed. Values are quoted from pages as they were fetched on
**2026-11-17**. "not on page" means the page I fetched does not show it; "unknown" means I
could not check.

## How this was checked

- `robots.txt` was fetched first for every host (curl, generic browser User-Agent). If a path
  was disallowed, or robots.txt could not be read because of a bot block, the page was **not**
  fetched.
- At most a few requests per site. No login, no loops, no header tricks or headless browser
  to get past blocks.
- **Rendering check:** each page was fetched once with `curl`. Script and style blocks and
  all tags were then stripped, and the remaining text was searched for dates, team size,
  fee and eligibility. If the fields show up in that text, they are "in raw HTML". If the
  text is just an app shell ("enable JavaScript"), the site is "JS-only".
- Official URLs were found by web search. They were then confirmed by the page's own
  domain/branding.

## Summary

| # | Source | Official URL used | 2026-27 running? | robots.txt | Rendering | Feed / API | Stability |
|---|---|---|---|---|---|---|---|
| 1 | COMAP MCM/ICM | contest.comap.com/undergraduate/contests/mcm/ (not re-fetched) | yes (our hand-verified data) | **www.comap.org blocks ClaudeBot/anthropic-ai on `/`, and `/undergraduate/` for all agents**; contest.comap.com has no robots.txt | not checked | unknown | medium |
| 2 | Putnam (MAA) | maa.org/putnam/ (not fetched) | unknown | **unreadable: 403 bot block** | not checked | unknown | unknown |
| 3 | ICPC North America regionals | nac.icpc.global, *.na.icpc.global, icpc.global/regionals | unknown (not seen on an official page) | nac: allowed; na./gny.: **406 bot block**; icpc.global: empty file (allows all) | nac: blocked; icpc.global: **JS-only** | unknown | low |
| 4 | ASA DataFest | ww2.amstat.org/education/datafest/ | yes: 2027 date window posted | allowed | raw HTML | no | medium |
| 5 | Kaggle competitions | www.kaggle.com/competitions | ongoing listing | **no robots.txt (HTTP 404)** | **JS-only** | yes: official Kaggle API (needs account token); not checked this session | low (HTML) / high (API) |
| 6 | IMC Prosperity | prosperity.imc.com | **unknown**: page says "Prosperity 4 finished" | allowed (`/` allowed; `/game/` etc. disallowed) | raw HTML (Next.js server-rendered) | no | low |
| 7 | WorldQuant BRAIN IQC | worldquantbrain.com/iqc; worldquant.com/iqc | **unknown**: page still shows IQC 2026 | worldquantbrain.com: allowed; worldquant.com: allowed but page **403 Cloudflare** | raw HTML (thin) | no | low |
| 8 | INFORMS O.R. & Analytics Student Team Competition | informs.org prize page; connect.informs.org/oratc/home | **appears inactive** (see section) | allowed for both | raw HTML | no | n/a |
| 9 | MLH season listing | mlh.io/seasons/2027/events (→ www.mlh.com) | yes: 2027 season listed | allowed (`/seasons/` not disallowed) | raw HTML + embedded JSON | partial: JSON in page; `apiBaseUrl: https://api.mlh.com` seen, not tested | high |

**Takeaways for step 2:**
- **MLH** is the easiest first target. Event data is embedded as structured JSON with ISO
  timestamps, plus schema.org `Event` microdata.
- **DataFest** is simple static HTML, but the student-facing dates are per host site.
- **Kaggle** should go through its official API, not HTML.
- **COMAP, MAA and ICPC** block automated access (an explicit AI block, bot walls). Plan on
  manual entry or permission instead of scraping. COMAP's explicit `ClaudeBot`/`anthropic-ai`
  block also applies to me fetching it during development.

---

## 1. COMAP MCM / ICM (baseline)

- **URLs:** `https://contest.comap.com/undergraduate/contests/mcm/` (our `sourceUrl`),
  `https://www.comap.org/contests/mcm-icm` (our `officialUrl`).
- **Not fetched this session.** `www.comap.org/robots.txt` has
  `User-agent: ClaudeBot / anthropic-ai / Claude-Web → Disallow: /`. It also blocks GPTBot,
  PerplexityBot and others. For `User-agent: *` it has `Disallow: /undergraduate/` and
  `Crawl-delay: 10`. `contest.comap.com/robots.txt` returns an HTML page (HTTP 200, not a
  robots file), so technically that host has none. I didn't fetch it anyway, because COMAP
  clearly signals no AI access.
- **2026-27 / undergrads:** yes, according to our hand-verified edition (`lastVerifiedAt`
  2026-11-09): deadline 2027-01-28, contest 2027-01-28 → 2027-02-01, team 1–3, "Undergraduate
  teams; an advisor must register the team", note "Entry fee $100 per team".
- **Rendering / feed / fields:** not checked this session.
- **Stability guess:** medium. Joomla site with a stable URL pattern, but the content is
  hand-edited each year.
- **Surprising:** the organizer of our only verified source has an explicit AI-crawler
  block. Even a non-AI scraper would hit `Disallow: /undergraduate/` on www.comap.org.
  Recommendation: keep COMAP as manual entry, or ask COMAP for permission.

## 2. William Lowell Putnam Competition (MAA)

- **URL:** `https://maa.org/putnam/` (from web search: MAA's own domain). Not fetched.
- **robots.txt:** `maa.org/robots.txt` and `www.maa.org/robots.txt` both return
  **403 Forbidden** to curl (bot protection). Because robots.txt can't be read, no page was
  fetched.
- **2026-27 / undergrads / all fields:** unknown (not checked).
- **Rendering / feed / login:** unknown.
- **Stability guess:** unknown.
- **Surprising:** robots.txt itself is behind the bot wall. Putnam is likely a manual-entry
  source. Someone could check `maa.org/putnam/` by hand in a browser.

## 3. ICPC North America regionals

- **Candidate official URLs (please confirm which one we treat as the source):**
  - `https://nac.icpc.global/`: North America Championship site.
  - `https://na.icpc.global/`: North America hub (seen only in search results).
  - Per-region sites, e.g. `https://gny.na.icpc.global/`, `https://ma.na.icpc.global/`,
    `https://ne.na.icpc.global/`, `https://mc.na.icpc.global/`, `https://nc.na.icpc.global/`.
  - `https://icpc.global/regionals`: global regional finder.
- **robots.txt:**
  - `nac.icpc.global`: allowed (only `/wp-admin/` disallowed; WordPress sitemap listed).
  - `na.icpc.global` and `gny.na.icpc.global`: robots.txt itself returns **406 "generated by
    Mod_Security"**.
  - `icpc.global`: empty robots.txt (HTTP 200, 0 bytes), so everything is allowed.
- **Rendering:**
  - `nac.icpc.global/`: the page also returned the 406 Mod_Security block to curl, so its
    content wasn't checked.
  - `icpc.global/regionals`: **JS-only**. The raw HTML is a React app shell ("You need to
    enable JavaScript to run this app") plus Google reCAPTCHA.
- **2026-27 / undergrads / all fields:** unknown (not seen on an official page I could fetch).
- **Feed / API:** unknown. The regional sites are WordPress (`/wp-sitemap.xml`), which
  often expose a REST API, but this wasn't checked.
- **Spread across pages:** yes. Each region has its own site, and there are about 10 NA
  regions.
- **Stability guess:** low. Many separately run regional sites, a WAF in front of them, and
  a JS app for the global finder.
- **Surprising:** the WAF blocks plain curl even on robots.txt. A polite scraper would
  probably need to contact ICPC NA, or the data would be entered by hand once per season
  (dates are about 10 rows a year).

## 4. ASA DataFest

- **URLs:** `https://ww2.amstat.org/education/datafest/` (index),
  `.../hosting.cfm`, `.../datafestinabox.cfm`, `.../participants.cfm`.
- **2026-27:** yes. hosting.cfm says organizers must "hold the event within the date range
  March 12, 2027 – May 2, 2027". The hashtag is `#ASADataFest27`.
- **Undergrads:** yes. The index says "teams of undergraduates work around the clock".
- **robots.txt:** allowed (`/education/datafest/` is not disallowed; only `/education/cas/`
  and a few others are). No terms-of-use note seen.
- **Rendering:** raw HTML. Plain ColdFusion pages, and all the text is visible after
  stripping tags.
- **Feed / API:** no (none seen).
- **Fields:**
  - registrationDeadline: **not on page for students**. The only deadline is for host
    institutions: "register here no later than February 19, 2027". Student registration is
    per host site.
  - startDate / endDate: not on page per event. Only the national window "March 12, 2027 –
    May 2, 2027" (free text). Each host picks its own weekend, about 48 hours.
  - teamSizeMin/Max: datafestinabox.cfm, "Students compete in teams of 2-5 people."
  - eligibility: "teams of undergraduates" (index). Organizers must be faculty/staff, not
    students (hosting.cfm).
  - entry fee: not on page.
  - topics: free-text description ("find and share meaning in a large, rich, and complex
    data set"). The dataset is secret until the event.
- **Spread across pages:** yes, the facts are split over 3 ASA pages. participants.cfm (the
  list of host sites) currently says "Coming Soon!". Real per-site dates live on each
  university's own page.
- **Login wall:** no for public info. The data set goes through the ASA Community
  (membership).
- **Stability guess:** medium. Old, rarely redesigned static pages, but key facts are buried
  in prose sentences.
- **Surprising:** DataFest is many local events, not one. Our one-Edition-per-season model
  can hold the national window, but real deadlines depend on the host campus.

## 5. Kaggle competitions listing

- **URL:** `https://www.kaggle.com/competitions`
- **2026-27 / undergrads:** an ongoing rolling listing, not a season. Eligibility varies per
  competition (not checked).
- **robots.txt:** `https://www.kaggle.com/robots.txt` returns **HTTP 404** (Kaggle's HTML
  404 page), so there is no robots.txt. Terms of use were not reviewed in this step.
- **Rendering:** **JS-only.** The raw HTML is about 5 KB; after stripping, the only text is
  the title "AI Competitions and Hackathons | Kaggle". The page also loads reCAPTCHA
  Enterprise site-wide.
- **Feed / API:** yes, from general knowledge, not checked this session. Kaggle has an
  official public API/CLI (`kaggle competitions list`) that needs a free account API token.
- **Fields:** not checked (nothing in the raw HTML). Team size, deadline, etc. are
  per-competition.
- **Login wall:** listing is public; the API needs an account token.
- **Stability guess:** low for HTML (React app); high for the official API.
- **Surprising:** most Kaggle competitions aren't student-specific. We'd need a filtering
  rule for which ones belong on CompTrack.

## 6. IMC Prosperity

- **URL:** `https://prosperity.imc.com/` (rules PDF linked at `/docs/terms-and-conditions.pdf`,
  not fetched).
- **2026-27:** **unknown.** The page header says "Prosperity 4 finished". No Prosperity 5
  announcement on the page.
- **Undergrads:** yes. "designed for university students"; prize eligibility needs "Proof
  that they were enrolled at a university at the time of registration, and are at least 18
  years of age".
- **robots.txt:** allowed for `/`. Disallowed: `/game/`, `/settings/`, `/onboarding/`,
  `/debug/`, `/calculating-scores/`, `/badges/`, `/winner-announcement`. The page says "All
  participants are required to review and accept the full Terms & Conditions prior to
  registering".
- **Rendering:** raw HTML. Next.js server-rendered (`self.__next_f` RSC payload); the FAQ
  text is all in the HTML.
- **Feed / API:** no (none seen; sitemap.xml exists).
- **Fields:**
  - registrationDeadline: not on page ("Tutorial Round (available to participants
    immediately after signing up): March 16th - April 13th").
  - startDate / endDate: "The official Prosperity challenge takes place between April 14th —
    April 30th". **No year anywhere on the page.**
  - teamSizeMin/Max: "there can be up to 5 players per team" (max 5; min not on page).
  - eligibility: quoted above, plus regional prize limits ("EMEA, North America, South
    America, India, Australia, or Hong Kong").
  - entry fee: not on page.
  - topics: "algorithmic and manual trading strategies"; Python.
- **Login wall:** the game is behind sign-up; info pages are public.
- **Stability guess:** low. A themed marketing page that is redesigned for each edition
  ("A trading challenge of cosmic proportions").
- **Surprising:** dates have no year, so a scraper can't tell this year from last year
  without other signals (e.g. the edition number "Prosperity 4").

## 7. WorldQuant BRAIN International Quant Championship (IQC)

- **URLs:** `https://worldquantbrain.com/iqc`, `https://www.worldquant.com/iqc` (guidelines).
- **2026-27:** **unknown.** The page title is "International Quant Championship 2026"; it
  says the global finals are "expected to be held in Singapore in September 2026". No 2027
  edition on the page.
- **Undergrads:** not on page (it says "Please refer to the official guidelines for all
  rules"). The guidelines page couldn't be fetched (see below).
- **robots.txt:** `worldquantbrain.com` → `Allow: /`. `www.worldquant.com` → allows all,
  `Crawl-delay: 10`. But `www.worldquant.com/iqc` returned **403 "Sorry, you have been blocked"
  (Cloudflare)**, so it wasn't checked. `platform.worldquantbrain.com/robots.txt` → 403
  AccessDenied.
- **Rendering:** raw HTML, but thin: only the marketing text above is present.
- **Feed / API:** no (none seen).
- **Fields:** registrationDeadline / startDate / endDate / teamSize / entry fee: not on page.
  Topics: "Break into the world of quantitative finance". Eligibility: not on page.
- **Login wall:** the "Sign In" link goes to the BRAIN platform; the competition itself
  happens there.
- **Stability guess:** low. Key rules are on a Cloudflare-protected page; the landing page
  is minimal and per-year.
- **Surprising:** the landing page has no dates at all. Real details are only in the
  guidelines.

## 8. INFORMS O.R. & Analytics Student Team Competition

- **URLs:**
  `https://www.informs.org/Recognizing-Excellence/INFORMS-Prizes/INFORMS-O.R.-Analytics-Student-Team-Competition`,
  `https://connect.informs.org/oratc/home`.
- **2026-27:** **appears not to be running.** connect.informs.org/oratc/home: "The OR &
  Analytics Student Team Competition is being reviewed. The competition will not be held for
  the 2020-2021 competition year." (page footer "INFORMS © 2022"). The prize page's latest
  winner is 2020.
- **Undergrads:** the prize page says it's for "undergraduate and master's level students".
- **robots.txt:** allowed for both (`/Recognizing-Excellence/` isn't disallowed;
  connect.informs.org disallows `/HigherLogic/`, `/*/RSS` and a few others, not `/oratc/`).
  The page footer links "Terms of Use" (not reviewed).
- **Rendering:** raw HTML.
- **Fields:** all not on page except a format description (written submissions; finalists
  "present their solutions … at the INFORMS Business Analytics Conference in April").
- **Stability guess:** n/a (inactive).
- **Surprising:** the "INFORMS Case Competition" listed next to it is for **teaching cases
  written by faculty/practitioners** (2025 winners are from companies and universities;
  "2026 Submission Deadline: July 31, 2026"), so it isn't a student competition either.
  **Needs a decision:** drop INFORMS, or look for a different INFORMS student event.

## 9. MLH hackathon season listing

- **URL:** `https://mlh.io/seasons/2027/events`. It redirects to
  `https://www.mlh.com/seasons/2027/events`. MLH's "2027 season" covers the 2026-27
  academic year (the listing starts with Nov 2026 events).
- **2026-27:** yes. Title "2027 Season Schedule | Major League Hacking"; "24 upcoming and 24
  past events shown".
- **Undergrads:** not stated on the listing page. Some events are tagged "High school".
  Per-event eligibility is on each event's own site.
- **robots.txt:** allowed. `/seasons/` isn't disallowed; disallowed paths include
  `/account/`, `/auth/`, `/v4/`, `/events/*/partners/*/promo_codes/`. Footer links "Terms of
  Service" (not reviewed).
- **Rendering:** raw HTML, in three forms. (1) Visible text ("Hack Western 13 NOV 20 - 22
  London, Ontario, CA In-Person"). (2) schema.org `Event` microdata
  (`<meta itemProp="startDate" content="2026-11-20T23:00:00Z"/>`, 24 `itemType=…/Event`).
  (3) An Inertia.js JSON blob `<script data-page="app" type="application/json">` with
  `props.upcomingEvents` / `props.pastEvents`.
- **Feed / API:** partial. The JSON is embedded in the page. Each event has keys `name`,
  `startsAt`, `endsAt`, `dateRange`, `formatType`, `status`, `region`, `customFields`
  (e.g. `{"hackathon_focus": ["Software","Hardware"]}`), `url`, `websiteUrl`. The page
  props also include `apiBaseUrl: "https://api.mlh.com"`. I didn't test it or check whether
  it's public.
- **Fields:**
  - registrationDeadline: not on page.
  - startDate / endDate: yes, ISO 8601 UTC (`"startsAt": "2026-11-20T23:00:00Z"`). Convert to
    New York dates before storing.
  - teamSizeMin/Max: not on page.
  - eligibility: not on page (only tags like "High school", "Diversity").
  - entry fee: not on page.
  - topics: only `hackathon_focus` tags (e.g. Software, Hardware).
- **Spread across pages:** the listing is one page. Deadlines, team size and eligibility live
  on each hackathon's own website (`websiteUrl`), which vary wildly.
- **Login wall:** no.
- **Stability guess:** high for the JSON keys (they come from the app's data model, not the
  HTML layout), but MLH did change domain (mlh.io → mlh.com), so it isn't fully stable.
- **Surprising:** "24 upcoming … shown", so the page might be paginated or truncated. Check
  how to get the full season in step 2. Also, each hackathon is its own competition, so one
  MLH source would create many Competition rows under one Organizer (MLH), or one Organizer
  per hackathon. That's a data-model decision.

---

## Decisions (2026-11-17)

- **Strategy is hybrid.** Flagship competitions are entered and re-verified by hand. Only
  sources whose robots.txt and terms allow it are fetched automatically. We never work
  around robots.txt, bot blocks, 403/406 responses, or user-agent rules.
- **Manual entry:** COMAP (MCM/ICM), MAA (Putnam), ICPC, IMC Prosperity, WorldQuant IQC.
  `sourceUrl` is still the official page.
- **ICPC:** the source is the regional site that covers Boston-area schools (Simmons).
  Region to be confirmed by Yilin.
- **INFORMS ORATC:** dropped (discontinued).
- **ASA DataFest:** one Competition, with one Edition per year using the national window.
  Dates vary by host site.
- **MLH:** used only as the step-2 scraping prototype. Whether and how hackathons appear on
  the site is undecided.
- **Kaggle:** possibly later, through the official API. Not now.

## Open questions for review

The decisions above answer questions 1–3, and question 4 for DataFest. How MLH fits the
model is still open.

1. **ICPC NA:** which URL is the source of truth (nac / na hub / per-region sites)? All but
   nac blocked curl.
2. **INFORMS:** the ORATC looks discontinued. Drop it, or find another INFORMS student
   competition?
3. **COMAP / MAA:** both block automated access (COMAP explicitly blocks Claude). Keep them as
   manual-entry sources?
4. **MLH / DataFest** are "many events under one umbrella". How should they map onto
   Organizer → Competition → Edition?
