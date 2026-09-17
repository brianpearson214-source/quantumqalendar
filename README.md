# Quantum Calendar

A hand-curated calendar of quantum computing conferences, summits, workshops and
community events.

**Scope: North America** — United States, Canada and Mexico — plus online events
that anyone can join regardless of location. Listings are compiled from
<https://quantum.technology/conf/index.html>, IBM's own events listing at
<https://www.ibm.com/quantum/events>, and organizers' pages where those exist.

Static site: plain HTML, CSS and vanilla JS. No build step, no dependencies.

## Local preview

`events.json` is loaded with `fetch()`, so opening `index.html` directly from the
filesystem will not work (the browser blocks `file://` requests). Serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Adding or editing an event

Everything lives in [`events.json`](events.json). Add an object to the `events`
array — order doesn't matter, the page sorts by start date.

```json
{
  "id": "unique-slug-2027",
  "name": "Full conference name",
  "shortName": "Optional short name (used in the hero countdown)",
  "start": "2027-03-15",
  "end": "2027-03-18",
  "city": "Chicago",
  "place": "Venue, City, State or Country",
  "country": "United States",
  "region": "us",
  "category": "industry",
  "audience": "Who the event is for",
  "format": "in-person",
  "url": "https://example.org/",
  "featured": false,
  "blurb": "One sentence on what the event is."
}
```

Field notes:

| Field | Values |
| --- | --- |
| `region` | `us`, `canada`, `mexico`, `online` — drives the "Where" filter |
| `category` | `industry`, `research`, `policy`, `community` — drives the "What" filter |
| `format` | `in-person`, `hybrid`, `virtual` |
| `audience` | Free text, shown in the "Intended audience" column |
| `featured` | `true` highlights the row. Use sparingly — 2–3 per year |
| `end` | Optional; omit for single-day events |
| `url` | Optional; the name renders unlinked if empty |

Also bump `"updated"` at the top of the file — it renders in the footer.

Dates are compiled from organizers' official pages. They change; re-check before
each release.

## Chicago startup tracker

`startups.html` renders [`startups.json`](startups.json). Each entry:

```json
{ "id": "memq", "name": "memQ", "url": "https://memq.tech/", "area": "hardware", "founded": 2021 }
```

| Field | Values |
| --- | --- |
| `area` | `hardware`, `software`, `applications`, `consulting` |
| `founded` | Four-digit year, or `null` if it can't be verified — renders as "—" |
| `url` | The company's own site. Leave `""` rather than guess; the name renders unlinked |

**Inclusion rule:** headquartered in the Chicago area today and still independent.
That excludes Chicago *offices* of companies based elsewhere (PsiQuantum, IonQ,
Pasqal, Infleqtion, Diraq), Duality alumni headquartered in other cities, and
acquired companies (Super.tech, NuCrypt).

Sources: the Chicago Quantum Exchange's
[Quantum Prairie map](https://chicagoquantum.org/quantum-economy/quantum-companies-region),
[Duality's cohorts](https://www.dualityaccelerator.com/innovators/), and the
[Polsky Venture Gallery](https://polsky.uchicago.edu/venture-gallery/) (filter by
the Quantum industry tags). Verify each company's HQ separately — all three
sources list companies that are not actually based in Chicago.

## Cache busting

GitHub Pages serves assets with `cache-control: max-age=600`, so a returning
visitor can see a stale stylesheet for up to ten minutes after a deploy.
`index.html` therefore loads `style.css?v=N` and `app.js?v=N` — **bump `N` in
`index.html` whenever you change either file** and the update lands immediately.
`events.json` is fetched with `cache: 'no-cache'` and needs no bump.

## Deploying

Any static host works. For GitHub Pages: push to `main`, then enable Pages on the
repository root. Add a `CNAME` file containing the domain if you're using a custom one.
