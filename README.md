# CompTrack

**Closing the opportunity gap for students at small colleges.**

CompTrack is a competition tracker for college students — discover quant, ML, math, modeling,
and other academic competitions, filter by field, bookmark favorites, and view deadlines on a
calendar.

Students at large universities hear about competitions through career centers, clubs, and
alumni networks. Students at smaller schools usually have to find them alone, often after
registration has closed. CompTrack brings that information into one place.

Live site: https://comptrack-lime.vercel.app

## Features

- **Home** — Competition cards with name, field, deadline, difficulty, and skill tags
- **Filter** — Filter competitions by field
- **Calendar** — Monthly view of competition deadlines
- **Save** — Bookmark competitions (stored in browser localStorage)

### In progress
- Richer data model: Organizer → Competition → Edition, team size, competition tier
- Automated scraping pipeline to collect competition listings
- Scheduled refresh and automatic removal of expired competitions

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript
- Deployed on Vercel

## About

Built by Yilin Bai (Simmons University, Mathematics) as a 2026–2027 Simmons
**Passionate Leaders Project**, supervised by Prof. Nanette Veilleux.
