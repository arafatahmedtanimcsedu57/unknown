## Context

This is a greenfield, **static, frontend-only** project & billing tracker. There is no backend, database, API, or authentication service. The app is a single-page React application that loads a bundled fictional dataset, lets a user manipulate it entirely in the browser, and persists changes to `localStorage`. It borrows only the *domain shape* (clients, projects, cost codes, two status pipelines, documents) from an inspiration spreadsheet — none of that file's data or the file itself is part of the project.

Chosen stack (fixed by the request): **React** (UI), **Zustand** (state), **Tailwind CSS** (styling). Target runtime: any static host, or the built `index.html` opened directly.

Key constraints:
- No server round-trips of any kind. All logic (cost-code generation, margin, dashboard aggregation, xlsx parsing) runs client-side.
- Data must be fictional; the original spreadsheet is excluded from the repo.
- Must survive a page refresh (localStorage) and offer escape hatches (Export/Import/Reset) since there is no server backup.

## Goals / Non-Goals

**Goals:**
- Prove the end-to-end workflow (create → status pipeline → billing → dashboard) with zero backend.
- Ship a convincing demo out-of-the-box via a bundled fictional dataset (6 clients, 8 owners, ~40 projects).
- Be source-agnostic: a user can import a *different* xlsx and the app works on it.
- Keep state predictable and easy to reason about with a single Zustand store + localStorage persistence.
- Look and feel like an operational tool (dense tables, status color-coding, tabular figures).

**Non-Goals:**
- No backend, API, database, or server-side persistence.
- No real authentication, authorization, multi-user, or data sharing across devices.
- No real file uploads (documents are links + checkboxes).
- No notifications, no audit server, no accounting/ERP integration.
- No use of the original source spreadsheet as data.

## Decisions

### 1. Build tooling: Vite + React + TypeScript
- **Choice**: Vite SPA, React function components, TypeScript.
- **Why**: Fast dev server, trivial static build (`vite build` → static `dist/`), first-class React + TS support. TypeScript gives us typed domain models (Project, Client, Owner, Status enums) which matters because the whole app is data-shaped.
- **Alternatives**: Next.js (overkill — we want no server/SSR, static export adds complexity); single-file HTML + CDN React (harder to maintain, no bundling of SheetJS/charts).

### 2. State: one Zustand store, sliced by domain
- **Choice**: A single Zustand store composed of slices — `dataSlice` (entities: projects, clients, owners), `sessionSlice` (acting-as user + role, active year, filters), and `uiSlice` (modals, toasts). Derived data (margin, dashboard aggregates, filtered lists) computed via selectors/memoized helpers, not stored.
- **Why**: Zustand is lightweight, no boilerplate, and selectors keep derived values out of state (single source of truth = the raw entities). Slices keep concerns separated without Redux ceremony.
- **Alternatives**: Redux Toolkit (heavier than needed for a static app); React Context (re-render churn on a data-dense app).

### 3. Persistence: Zustand `persist` middleware → localStorage
- **Choice**: Persist only the `dataSlice` (+ light session prefs) to `localStorage` under a versioned key. On first load with empty storage, hydrate from the bundled sample.
- **Why**: Survives refresh with near-zero code; versioned key lets us invalidate on schema change. Keeps derived/UI state out of storage.
- **Trade-off**: Data is per-browser and can hit the ~5MB localStorage limit — acceptable for ~40–hundreds of projects. Export/Import JSON covers portability.

### 4. Data source: bundled sample + client-side xlsx import (both)
- **Choice**: Ship `sample-projects.json` (canonical) generated offline. Provide **Import xlsx** using **SheetJS (xlsx)** parsed in-browser into the same normalized model; **Import/Export JSON** for round-tripping; **Reset** re-hydrates from the bundled sample.
- **Why**: Satisfies "another xlsx may be a data source" literally, while the bundled sample makes the app demo instantly with no file needed. SheetJS is the de-facto client-side xlsx library and needs no server.
- **Import contract**: expects the documented column headers (see specs). Unknown/missing columns are reported to the user, not silently dropped. Imported files are parsed in memory and discarded — never uploaded or stored as a file.
- **Alternatives**: CSV-only (loses the "xlsx as data source" requirement); server-side conversion (violates no-backend).

### 5. Fake auth via an "Acting as" switcher
- **Choice**: A top-bar dropdown selects the current user (one of the 8 owners / an admin) and role (Admin / Owner / Finance / Viewer). Role gates edit affordances client-side; "My Projects" filters to the acting user.
- **Why**: Demonstrates per-owner views and role-based UI with no auth infrastructure. Purely presentational — no security is claimed or implied.

### 6. Domain model & the cost-code rule
- **Entities**: `Client { id, name, shortCode, comNum }`, `Owner { id, name, active }`, `Project { id, code, clientId, ownerId, name, estimateDate, poNumber, poAmount, billAmount, cost, executionFrom, executionTo, projectStatus, billStatus, clientContact, clientCell, notes, documents[], activity[] }`.
- **Cost code**: generated client-side as `YY + comNum(2) + seq(3)` (e.g. `26 01 001` → `2601001`/`26-01-001`), where `seq` is the next per-client sequence. The store owns the counter so codes stay unique — this is the single most important thing the app does better than the spreadsheet.
- **Status enums** (canonical, no typos):
  - Project: `Ongoing → Acknowledged → Completed → Coupa Receiving → Client Bill Submitted → Payment Received`.
  - Bill: `No Internal Bill → Pending → QC → Submitted → Completed`.
- **Margin**: derived `poAmount − cost`, with percentage; never stored.

### 7. Dashboard aggregation & charts
- **Choice**: Aggregate client-side with plain reducers over the filtered project set (counts by status, sums of PO/Bill/Cost/Margin, group-by client/owner, alert predicates). Render with a lightweight chart approach (Recharts, or hand-rolled SVG/Tailwind bars for the simplest cases).
- **Why**: Data volume is tiny; no need for a data layer. Keeps the bundle small.

### 8. Styling & design language
- **Choice**: Tailwind utility classes; a small set of shared primitives (StatusPill, MarginBadge, DataTable, KpiTile, KanbanCard). Neutral canvas + status-driven color; mono/tabular figures for codes and money; light-first with dark-ready tokens.
- **Why**: Consistent, dense, operational feel; keeps components composable without a heavy component library.

## Risks / Trade-offs

- **localStorage is the only store** → data loss if cleared / different browser. *Mitigation*: prominent Export JSON, Reset-to-sample, and (optionally) an auto-download reminder; document the limitation in-app.
- **localStorage size ceiling (~5MB)** → large imports could overflow. *Mitigation*: MVP data is small; warn on oversized imports; JSON export as backup.
- **xlsx import shape mismatch** → user imports an incompatible sheet. *Mitigation*: validate headers against the documented contract, show a clear mapping/error report, never partially corrupt the working set (import is all-or-nothing into a preview then commit).
- **Fake auth mistaken for real security** → someone assumes role gating protects data. *Mitigation*: it's client-side only; clearly label as a demo switcher; no sensitive data involved.
- **Bundle weight from SheetJS + charts** → slower first load. *Mitigation*: lazy-load the xlsx parser and chart lib (code-split) so the core table loads fast.
- **Domain drift from the muse file** → accidentally reintroducing real data. *Mitigation*: source file excluded from repo; sample data is explicitly fictional (Acme/Globex/etc.).

## Migration Plan

Not applicable in the traditional sense (greenfield, no existing users/data). Equivalent steps:
1. Scaffold Vite + React + TS + Tailwind + Zustand.
2. Generate the fictional `sample-projects` dataset offline and bundle it.
3. Build features per `tasks.md` in the specified order.
4. Ship as a static build; "rollback" = redeploy previous static build. User data is local and unaffected by deploys.

## Open Questions

- **Charts**: Recharts (richer, heavier) vs hand-rolled SVG/Tailwind bars (lighter). Default: start hand-rolled for the 2 status charts + KPIs; adopt Recharts only if breakdowns need it.
- **Documents**: link + checkbox confirmed for MVP; revisit real uploads only alongside a future backend.
- **Persistence**: localStorage confirmed as default (over pure in-memory) so edits survive refresh.
