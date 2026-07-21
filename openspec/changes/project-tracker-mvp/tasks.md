## 1. Project scaffold & tooling

- [x] 1.1 Scaffold a Vite + React + TypeScript app
- [x] 1.2 Install and configure Tailwind CSS (config, base styles, dark-ready tokens)
- [x] 1.3 Add Zustand; add SheetJS (xlsx) and a chart approach (lazy-loaded)
- [x] 1.4 Set up folder structure (components, store/slices, domain/types, data, lib)
- [x] 1.5 Confirm static build (`vite build`) outputs a self-contained `dist/`

## 2. Domain model & fictional sample data

- [x] 2.1 Define TypeScript types: Client, Owner, Project, Document, ActivityEntry, status enums
- [x] 2.2 Define canonical Project Status and Bill Status enums (ordered)
- [x] 2.3 Author fictional sample: 6 clients (Acme/Globex/Initech/Umbrella/Contoso/Northwind + com_nums)
- [x] 2.4 Author 8 fictional owners
- [x] 2.5 Author ~40 fictional projects with realistic skew across clients/owners/statuses
- [x] 2.6 Bake in edge cases: 2–3 loss-making, 2–3 missing PO, a few payment-overdue
- [x] 2.7 Bundle sample as JSON (and optionally a matching sample xlsx)

## 3. State store & persistence

- [x] 3.1 Create Zustand store with dataSlice, sessionSlice, uiSlice
- [x] 3.2 Add persist middleware → localStorage under a versioned key
- [x] 3.3 Hydrate from bundled sample on empty/incompatible storage
- [x] 3.4 Implement selectors/helpers for derived data (margin, filtered lists, aggregates)
- [x] 3.5 Implement client-side cost-code generator (year + comNum + per-client seq, unique)

## 4. App shell, navigation & acting-as

- [x] 4.1 Build shell layout: sidebar nav + top bar
- [x] 4.2 Wire client-side routing between sections
- [x] 4.3 Implement "acting as" switcher (user + role) bound to sessionSlice
- [x] 4.4 Implement role-based UI gating (Viewer/Owner/Finance/Admin)
- [x] 4.5 Implement year switch filtering all data views
- [x] 4.6 Make layout responsive (collapsible sidebar, scrollable tables)

## 5. Data source: import / export / reset

- [x] 5.1 Export current state → JSON download
- [x] 5.2 Import JSON (validate, replace state, persist)
- [x] 5.3 Import xlsx via SheetJS: validate headers, all-or-nothing, error report
- [x] 5.4 Reset to bundled sample (clear storage, re-hydrate)
- [x] 5.5 Export current project table → CSV/xlsx (respect filters/columns)

## 6. Project management

- [x] 6.1 Build shared primitives: StatusPill, MarginBadge, DataTable, KpiTile
- [x] 6.2 New/Edit project form with client-side validation
- [x] 6.3 Auto-generate cost code on create; block manual entry
- [x] 6.4 Live margin (PO − Cost) with profit/loss styling
- [x] 6.5 Soft-delete + restore
- [x] 6.6 Project detail view (all fields, statuses, margin, documents, activity)

## 7. Project listing

- [x] 7.1 All Projects table: columns, sticky header, sort, column show/hide
- [x] 7.2 My Projects view filtered to acting user + quick "New"
- [x] 7.3 Filters: status, client, owner, year, overdue (combinable)
- [x] 7.4 Text search across code, name, client, contact

## 8. Status pipelines & kanban

- [x] 8.1 Status change controls limited to valid next states (+ Admin override)
- [x] 8.2 Record timestamped activity entry + acting user on each change
- [x] 8.3 Kanban board with drag-and-drop between status columns
- [x] 8.4 Persist board changes and reflect in tables/detail

## 9. Documents checklist

- [x] 9.1 Render the 11-type checklist per project with present/absent state
- [x] 9.2 Attach external URL link per item (no upload)
- [x] 9.3 Completeness indicator ("n / 11")

## 10. Dashboard & reporting

- [x] 10.1 Projects-by-status and bills-by-status charts (client-side aggregation)
- [x] 10.2 Money KPIs: total PO / billed / cost / margin
- [x] 10.3 Breakdowns by client and by owner
- [x] 10.4 Alerts panel: loss-making, missing PO, overdue payment

## 11. Reference-data admin

- [x] 11.1 Clients admin: view/add/edit (name, short code, company number)
- [x] 11.2 Owners admin: view/add/edit, activate/deactivate
- [x] 11.3 Ensure numbering stays consistent when clients change

## 12. Polish & ship

- [x] 12.1 Apply design language (density, tabular figures, status colors, light/dark)
- [x] 12.2 In-app note that data is local-only (no server) with Export reminder
- [x] 12.3 Empty/error states (no results, invalid import, storage reset)
- [x] 12.4 Final static build + smoke test by opening the built output
