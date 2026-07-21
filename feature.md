# Project Tracking — MVP Feature List (Frontend-Only / Static)

> Domain idea (project & billing tracking) inspired by an existing spreadsheet.
> Companion doc: `user-flow.md`.
> Generic internal ops tool — not tied to any one company.
>
> **Scope of THIS document: a static, frontend-only MVP.**
> No backend. No database. No server auth. Runs as a static SPA
> (open in browser / deploy to any static host). Edits persist in the
> browser (localStorage).

---

## ⚠ Data policy (read first)

- The **original `Project Tracking-2026.xlsx` is INSPIRATION ONLY.**
  It is **not** part of this project — never shipped, imported, parsed,
  seeded, or referenced at runtime. We borrow only *ideas*: the domain
  shape (clients, projects, cost codes, two status pipelines, documents)
  and the flows.
- All data in the app is **freshly invented / fictional** — different
  clients, people, project names, and code numbers from the source.
- The app **may use a *different* xlsx as a data source** — a bundled
  fictional sample and/or any xlsx a user imports at runtime.

```
 Original xlsx ──(ideas only, offline)──► schema & flows
                                              │
 Fictional sample xlsx/json  ─── data ──►  THE APP  ◄── import any other xlsx
```

---

## 0. What "static, frontend-only" means here

```
  Bundled fictional sample (sample-projects.xlsx / .json)  ──┐
  ── OR ── user imports a different xlsx (parsed in-browser) ─┤
                                                              ▼
                            ┌──────────────────────────────────┐
                            │      Static SPA (browser)        │
                            │  • loads bundled sample on start │
                            │  • all logic client-side:        │
                            │      cost code, margin, pivots   │
                            │  • edits saved to localStorage   │
                            └──────────────────────────────────┘
                                   ▲                    │
                                   └──── refresh keeps ─┘
                                        localStorage data

   NO server · NO DB · NO API calls · NO real login
   (original 2026 xlsx is NOT here — inspiration only)
```

**Three things are deliberately faked (no backend):**

| Real app needs | MVP static substitute |
|----------------|-----------------------|
| Database | **bundled fictional sample** (xlsx/json) + browser **localStorage**; or an imported xlsx |
| Login / auth | **"Acting as" switcher** — pick a user/role from a dropdown |
| File storage | Document = a **URL link + checkbox**, no upload |

**Consequences to accept up front:**
- Data lives per-browser; not shared between people/devices.
- No concurrency, no audit server, no security — it's a demo/single-user tool.
- "Reset to seed" and "Export JSON" are the escape hatches (see 8.x).

---

## 1. Data & app shell (P0)

| # | Feature | Notes |
|---|---------|-------|
| 1.1 | Load **bundled fictional sample** on first run | Invented clients/people/codes — NOT from the source file |
| 1.2 | **Import a different xlsx** as data source (parsed in-browser) | Generic; expects the documented column shape (see `user-flow.md`) |
| 1.3 | Persist all edits to **localStorage** | Survives refresh; per-browser only |
| 1.4 | **"Acting as" switcher** (user + role) | Replaces login; drives "My Projects" + what's editable |
| 1.5 | App layout: sidebar nav + top bar (search, year, acting-as) | See nav map in `user-flow.md` §2 |
| 1.6 | Year switch (client-side filter) | Whatever years exist in the loaded data |
| 1.7 | Responsive (usable on laptop; degrade gracefully on mobile) | |

---

## 2. Projects (P0 — the core)

| # | Feature | Notes |
|---|---------|-------|
| 2.1 | **All Projects** table: sort, column show/hide, sticky header | Code, client, project, owner, status, bill, margin |
| 2.2 | Text search + filters (status, client, owner, year, overdue) | All client-side |
| 2.3 | **Project detail** view | All 20 fields + status + documents + local activity list |
| 2.4 | Create project (form) → saved to localStorage | |
| 2.5 | Edit / soft-delete project (local) | |
| 2.6 | **Auto cost-code generation (client-side)** | `26` + com_num + next seq → `26002001`, computed in-browser |
| 2.7 | **Live margin** (PO − Cost), colored badge | Green profit / red loss |
| 2.8 | Client-side validation | Client required; numeric amounts; valid dates; PO "NA" flagged |

---

## 3. My Projects (P0)

| # | Feature | Notes |
|---|---------|-------|
| 3.1 | List auto-filtered to the "acting as" user | Replaces the 17 static tabs |
| 3.2 | Same table/filter controls as All Projects | |
| 3.3 | Quick "+ New" pre-filled with me as owner | |

---

## 4. Pipelines / status (P0–P1)

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| 4.1 | Status pills for both pipelines | P0 | Project Status + Internal Bill Status, color-coded |
| 4.2 | Change status via dropdown (valid next states) | P0 | `Ongoing→…→Payment Received`; `No Bill→…→Completed` |
| 4.3 | Enforced enums (canonical spelling) | P0 | Fixes `Acknowlege`/`Clien bill submitted` |
| 4.4 | **Kanban board** (drag cards between columns) | P1 | Writes status to localStorage |
| 4.5 | Local timestamp on each change | P1 | Stored client-side for the activity list |

---

## 5. Dashboard (P0)

All computed client-side from localStorage — no server pivots.

| # | Feature | Notes |
|---|---------|-------|
| 5.1 | Projects-by-status chart | Live version of the Project Status pivot |
| 5.2 | Bills-by-status chart | Live version of the Internal Bill Status pivot |
| 5.3 | Money KPIs: total PO / Billed / Cost / Margin | Summed in-browser |
| 5.4 | Breakdown by client & by owner | GP/BAT/UBL… · Shovo/Benson/Ohid… |
| 5.5 | Simple alerts list | Loss-making · PO missing · (date-based) overdue |

---

## 6. Documents (P0-lite)

| # | Feature | Notes |
|---|---------|-------|
| 6.1 | Per-project checklist (11 doc types) | Estimate, PO, Agreement, Photo, Video, AV, Plan, Design, Completion Cert, Other, Logistic |
| 6.2 | Mark present + paste a **link** (no upload) | Backend-free substitute |
| 6.3 | Completeness bar ("4 / 11") | |

---

## 7. Reference data (P1)

Read from `seed.json`; editable in localStorage.

| # | Feature | Notes |
|---|---------|-------|
| 7.1 | View clients (name, short code, com_num) | Fictional: Acme=01, Globex=02 … |
| 7.2 | View users/owners | The sample roster (invented names) |
| 7.3 | Add/edit client or user (local) | Needed so 2.6 can number new clients |

---

## 8. Data safety escape hatches (P0 — important for static)

Because there's no server, these prevent data loss / enable sharing.

| # | Feature | Notes |
|---|---------|-------|
| 8.1 | **Export current state → JSON download** | The "save my work" button |
| 8.2 | **Import JSON** (replace state) | Move data between browsers/devices |
| 8.3 | **Import xlsx** (replace state) | Load a *different* project xlsx as the data source (client-side parse) |
| 8.4 | **Reset to bundled sample** | Wipe localStorage, reload the fictional sample |
| 8.5 | Export table → CSV/xlsx | Excel bridge for stakeholders |

---

## 9. MVP boundary — explicitly NOT in this version

- ❌ Any backend / API / database
- ❌ Real authentication, permissions, multi-user, sharing
- ❌ Real file uploads (links only)
- ❌ Notifications (email / WhatsApp)
- ❌ Server-side audit trail
- ❌ Any use of the original `Project Tracking-2026.xlsx` (inspiration only — never shipped/parsed)
- ❌ Server-side / persistent storage of imported files (import is parsed in-browser, then discarded)

> These are the natural "Phase 2 = add a backend" items once the frontend proves the flows.

---

## 10. Suggested build order (frontend only)

```
0. Craft the fictional sample dataset (clients/people/projects) — offline
1. App shell + nav + acting-as switcher + sample load + localStorage store
2. All Projects table (read) + filters/search
3. Project detail (read) + status pills + margin badge
4. Create/Edit project + client-side cost code + validation
5. My Projects (filtered)
6. Dashboard (charts + KPIs, computed client-side)
7. Documents checklist (links)
8. Export / Import (json + xlsx) / Reset  (data safety)
9. Kanban board + local timestamps   (P1 polish)
10. Reference-data admin (view/edit clients & users)  (P1)
```

---

## 11. Decisions

**Locked**
1. ✅ **Data source = BOTH** — bundled fictional sample loads by default; "Import xlsx" swaps it. (Import parses in-browser.)
2. ✅ **Sample dataset size = 6 clients · 8 owners · ~40 projects** — enough to make tables, filters, and dashboards look real.

**Still open (recommended defaults in italics)**
3. **Persistence** — *localStorage (edits survive refresh) + Export* vs pure in-memory (resets each load).
4. **Acting-as** — *free role switch for demo* vs a simple name pick only.
5. **Documents** — *link + checkbox* vs just a checkbox (defer links).
6. **Stack** — stack-agnostic here; the build step (not this doc) picks e.g. Vite + React vs a single-file HTML.

---

*This is a thinking artifact (explore mode). Building the actual static app = writing code, which means exiting explore mode and starting a change.*
