## Why

Agencies today track client projects and billing in a sprawling spreadsheet — one master sheet, per-person filtered copies that drift out of sync, hand-assembled cost codes, and manually refreshed status pivots. This is error-prone (status typos split reports, copies go stale, dates corrupt) and can't offer live dashboards or workflow. We want a clean, self-contained web app that proves the workflow end-to-end before any backend investment: a **static, frontend-only MVP** with no server, no database, and no real login — usable by opening it in a browser or deploying to any static host.

Scope note: the concept is inspired by an existing spreadsheet, but that file is **inspiration only** — never shipped, parsed, or used as a data source. The app ships its own **fictional** dataset and can import a *different* xlsx at runtime.

## What Changes

- New standalone **React + Zustand + Tailwind** single-page app, built to run **fully static** (no backend/API/database).
- **Fictional bundled dataset** (6 clients, 8 owners, ~40 projects) loaded on first run — no real/source data anywhere.
- **Data source = both**: bundled sample by default, plus **import any xlsx** parsed client-side to replace the working set.
- **Client-side persistence** via localStorage, with Export/Import JSON and Reset-to-sample as data-safety escape hatches.
- **"Acting as" switcher** stands in for authentication — pick a user + role (Admin / Owner / Finance / Viewer) to drive per-owner views and edit permissions.
- **Project management**: create/edit/soft-delete projects, **auto-generated cost codes** (year + client number + sequence, computed in-browser), live **margin** (PO − Cost), and client-side validation.
- **Project listing**: All Projects and per-owner "My Projects" tables with sort, filter, and search.
- **Two status pipelines** as enforced enums with status pills, guarded transitions, and a drag-and-drop kanban board.
- **Document checklist** per project (11 fixed types) with link + checkbox and a completeness indicator (no file upload).
- **Dashboard** computed client-side: projects-by-status and bills-by-status charts, money KPIs, client/owner breakdowns, and an alerts list (loss-making, missing PO, overdue).
- **Reference-data admin** for clients and owners, backing the cost-code numbering scheme.

No backend, real auth, file uploads, notifications, or multi-user sharing — these are explicitly deferred to a future "add a backend" phase.

## Capabilities

### New Capabilities
- `app-shell`: App layout, sidebar/top-bar navigation, the "acting as" user+role switcher (fake auth), year switch, and responsive shell.
- `data-persistence`: Source-agnostic data layer — load bundled fictional sample, persist edits to localStorage, import a different xlsx (client-side parse), import/export JSON, reset to sample, export table to CSV/xlsx.
- `project-management`: Project CRUD, client-side auto cost-code generation, live margin calculation, form validation, and the project detail view.
- `project-listing`: All Projects and My Projects tables with sorting, column visibility, text search, and multi-facet filtering (status, client, owner, year, overdue).
- `status-pipelines`: The Project Status and Internal Bill Status enums, status pills, guarded state transitions with local timestamps, and a drag-and-drop kanban board.
- `documents-checklist`: Per-project checklist of 11 document types with link + present/absent state and a completeness indicator.
- `dashboard-reporting`: Client-side dashboard — status charts, money KPIs, client/owner breakdowns, and an alerts panel.
- `reference-data`: View and edit clients (name, short code, company number) and owners, powering cost-code numbering.

### Modified Capabilities
<!-- None — this is a greenfield app; no existing specs. -->

## Impact

- **New project/codebase**: a static SPA scaffolded with Vite + React, Zustand for state, Tailwind for styling.
- **Dependencies**: React, Zustand, Tailwind CSS; a client-side xlsx parser (e.g. SheetJS) for import/export; a lightweight charting approach for the dashboard.
- **Assets**: a generated fictional `sample-projects` dataset (bundled as JSON and/or xlsx). The original source spreadsheet is excluded from the repo entirely.
- **No server-side impact**: no API, database, auth service, or file storage. State lives in the browser (localStorage); imported files are parsed in memory and discarded.
- **Deployment**: any static host (or open the built `index.html` directly).
