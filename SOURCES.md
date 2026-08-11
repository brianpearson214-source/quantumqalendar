# Sources

The ten places Quantum Calendar pulls events from, and the monthly routine for
working through them. All ten were verified reachable and carrying real listings
on 11 August 2026.

Scope filter applied to every source: **North America** (United States, Canada,
Mexico) plus **online events anyone can join**. Everything else is skipped.

## Tier 1 — machine-readable

These expose real feeds, so they can be parsed rather than read. Start here.

| # | Source | Feed | Covers |
| --- | --- | --- | --- |
| 1 | **Chicago Quantum Exchange** | `https://calendar.google.com/calendar/ical/chiquantumx%40gmail.com/public/basic.ics` | Chicago and Midwest — CQE members, partner seminars, Chicago Quantum Summit, career events |
| 2 | **Qureca Events Calendar** | <https://www.qureca.com/events-calendar/> — has an iCal export | Global conferences and workshops |

The CQE feed is the highest-signal source for anything local. It is a public
Google Calendar holding ~1300 entries, most of them past, so **filter to
`DTSTART >= today`** — there were only 3 upcoming when this file was written.
Note that Google all-day events use an **exclusive `DTEND`**: an event with
`DTSTART:20261111` and `DTEND:20261113` runs 11–12 November, not 11–13.

## Tier 2 — aggregators

Broad coverage, HTML only. Skim for North American entries the tier-1 feeds missed.

| # | Source | URL | Notes |
| --- | --- | --- | --- |
| 3 | **quantum.technology** | <https://quantum.technology/conf/index.html> | Maintained by Andrew White (Univ. of Queensland). Full-year list grouped by month; the widest academic coverage |
| 4 | **Quantum Computing Report** | <https://quantumcomputingreport.com/conferences/> | Industry-curated, good on commercial events |
| 5 | **Sutor Group** | <https://sutorgroupintelligenceandadvisory.com/upcoming-quantum-conferences/> | Bob Sutor's list, ~77 events, updated frequently — timestamps each update |
| 6 | **Entangled Future** | <https://entangledfuture.com/events/> | ~91 events, 2026–2027, tagged quantum vs AI/ML |
| 7 | **Qolour** | <https://www.qolour.com/events> | ~564 events, filterable by experience level, has a map view |

## Tier 3 — primary sources

Authoritative for their own events, and they carry things aggregators miss.

| # | Source | URL | Notes |
| --- | --- | --- | --- |
| 8 | **IBM Quantum** | <https://www.ibm.com/quantum/events> | Also check <https://www.ibm.com/quantum/blog> — application-only events like the Developer Conference never appear on the events page |
| 9 | **QED-C** | <https://quantumconsortium.org/events/> | US industry and government; QX, annual meeting, TAC meetings |
| 10 | **Optica** | <https://www.optica.org/events/> | Owns the big photonics venues with heavy quantum content: FiO+LS, CLEO, Quantum 2.0 |

### Rejected candidates

- **quantum.gov** (National Quantum Initiative) — authoritative but showed
  "0 upcoming events" when checked. Worth re-testing occasionally.
- **thequantuminsider.com/events** and **qureca.com/quantum-events** — both 404.
- **aps.org/events** — 403s to automated fetching; APS meetings (March Meeting,
  DAMOP) still turn up via tier 2.

## Monthly update routine

Run on the **1st of each month**.

1. **Pull tier 1.** Fetch the CQE `.ics`, filter to `DTSTART >= today`, and
   compare against `events.json` by name and date.
2. **Skim tier 2** for North American events not already listed. Where two
   sources disagree on dates, prefer the organizer's own page; failing that,
   prefer quantum.technology.
3. **Check tier 3** for first-party events, especially the IBM blog.
4. **Verify anything new** against the organizer's own site before adding it —
   aggregators carry stale and occasionally wrong dates.
5. **Drop nothing.** Past events stay in `events.json`; the site hides them
   behind the "Show past events" toggle.
6. **Update `"updated"`** at the top of `events.json` to today's date.
7. **Bump `?v=N`** in `index.html` only if `style.css` or `app.js` changed.
8. Commit and push. GitHub Pages redeploys automatically.

### Fields to fill for a new event

See the table in [README.md](README.md#adding-or-editing-an-event). `region` is
one of `us` / `canada` / `mexico` / `online`; `category` is one of `industry` /
`research` / `policy` / `community`. Leave `url` empty rather than guessing —
the name renders unlinked, which is better than a dead link.
