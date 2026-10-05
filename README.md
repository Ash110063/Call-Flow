# Call Flow

Automated airline hold-time monitoring, designed and developed by **Cplusoft**.

This repository holds two things:

| Folder | What it is |
| --- | --- |
| `/` (root) | The Call Flow clickable prototype, a Next.js app |
| `proposal/` | The sales proposal site (`index.html`) |

All data in the prototype is sample data held in memory. Nothing is saved to a server, and a page refresh resets it.

## Run the demo

```bash
npm install
npm run dev
```

Open http://localhost:3000. The demo opens straight on the Overview; no sign-in is required.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Overview: live KPIs, live jobs, calls in progress, insights |
| `/jobs` | Jobs list: status tabs, search, sort, row actions |
| `/jobs/new` | New job form with validation, live summary, pre-flight checks, test call, templates |
| `/jobs/[id]` | Job detail: live calls with ticking timers, transcript, recording player, pause / stop / retry |
| `/analytics` | Filters, trend chart, outcome split, best-time heatmap, airline comparison, call log |
| `/settings` | General, hotlines, voice & speech, notifications, team, API keys |
| `/login` | One-click demo entry (shown after Sign out) |

### How the prototype behaves

- Running jobs place new calls every few seconds and finish on their own. Toggle the **LIVE** pill on the Overview to pause the simulation.
- A job created on **New job** shows up in Jobs, Overview and its own detail page.
- CSV exports and transcript downloads produce real files.

## Single-file preview

`preview/` bundles the app into one self-contained HTML page (`preview/callflow-preview.html`) with an in-memory router, for sharing without a server.

```bash
node preview/build.mjs
```

## Proposal

- `proposal/index.html`: the proposal site. A copy in `public/proposal/` is served at `/proposal` on the deployed app. Its demo buttons link to https://call-flow-blue.vercel.app/.

## Design tokens

Defined in `app/globals.css` (`@theme`): primary `#3595FF`, sky `#22BDFF` / `#59CCFB`, soft `#D3E7FF` / `#D7E9FF`, background `#F3F7FF`, navy `#101038`.
Fonts: Google Sans Flex (UI) and Hero (headings, falls back to Google Sans Flex unless the font is installed or added to `public/fonts`).

## Structure

- `lib/data.ts`: sample data and generators (jobs, calls, transcripts, analytics)
- `lib/store.tsx`: shared client state, live simulation, toasts
- `components/`: app shell, UI primitives, charts
- `app/(app)/…`: screens behind the app shell; `app/login`: demo entry

## Contact

Cplusoft · sales@cplusoft.com · +974 7199 1599
