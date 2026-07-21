# Project Tracking — Web Application User Flows

> Derived from `Project Tracking-2026.xlsx` (Asiatic Experiential Marketing Ltd — project & billing tracker).
> This document describes **how people would use the web app**, not how to build it.
> It is a thinking artifact for exploration, not a final spec.

---

## 1. Who uses it (personas & roles)

The 17 person-tabs and the `Cost Code` roster tell us who's involved. In app terms:

| Role | Who (from the sheet) | What they mainly do |
|------|----------------------|---------------------|
| **Admin / Manager** | Team lead / ops | Manages reference data (clients, users, cost-code numbering, status lists), sees everything, runs reports |
| **Project Owner** | The 17 owners — Ohiduzzaman, Ali Ahmed Benson, Arman Polash, MD Khalaquzzaman Shovo, … | Create & update *their own* projects, move them through the pipeline, upload documents |
| **Finance / Billing** | Billing desk | Drives the **Internal Bill Status** pipeline, records payments, reconciles PO vs Bill vs Cost |
| **Viewer** | Leadership / auditors | Read-only dashboards and project detail |

> A single person can hold multiple roles (e.g. a Manager is also an Owner).

### Role × capability matrix

```
Capability                         Admin   Owner   Finance   Viewer
──────────────────────────────────────────────────────────────────
See all projects                     ✓       ~*       ✓        ✓
Create / edit own project            ✓       ✓        ~         ✗
Edit any project                     ✓       ✗        ~         ✗
Change Project Status                ✓       ✓        ✗         ✗
Change Bill Status / payments        ✓       ✗        ✓         ✗
Upload / verify documents            ✓       ✓        ✗         ✗
Manage clients / users / enums       ✓       ✗        ✗         ✗
View dashboards & reports            ✓       ✓        ✓        ✓
Import / export (xlsx)               ✓       ✗        ~         ✗
   * Owner default = "my projects"; may get read access to all.
   ~ = configurable / partial.
```

---

## 2. Global navigation map

```
┌──────────────────────────────────────────────────────────────────┐
│  ProjectTrack        [ 🔍 search ]        Year:2026 ▾   👤 Ohid ▾  │
├────────────┬─────────────────────────────────────────────────────┤
│ Dashboard  │                                                       │
│ My Projects│         (main content area for the active view)       │
│ All Projects                                                        │
│ Board      │                                                       │
│ Billing    │                                                       │
│ Documents  │                                                       │
│ Reports    │                                                       │
│ ─────────  │                                                       │
│ Admin ⚙    │   (Clients · Users · Cost Codes · Statuses · Import)  │
└────────────┴─────────────────────────────────────────────────────┘
```

---

## 3. Core flow — Create a new project

This replaces "add a row to the 2026 sheet." The magic here is **auto cost-code generation**, which the spreadsheet does by hand.

```
Owner clicks [ + New Project ]
        │
        ▼
┌─────────────────────────────────────────────┐
│  NEW PROJECT                                 │
│                                              │
│  Client        [ Grameenphone (GP) ▾ ]       │  ◄ dropdown from Clients table
│  Project Name  [ GP Daraz Gift Voucher     ] │
│  Owner         [ Ohiduzzaman ▾ ] (=me)       │  ◄ defaults to logged-in user
│  Estimate Date [ 2026-01-03 📅 ]             │
│  PO Number     [ GP00340359 ] (or "NA")      │
│                                              │
│  PO Amount     [ 1,510,519 ]                 │
│  Bill Amount   [ 1,510,519 ]                 │
│  Cost/Field    [ 1,411,700 ]                 │
│      → Margin auto-shows: +98,819 (6.5%) ✅  │  ◄ computed, PO − Cost
│                                              │
│  Execution From [ 2026-01-02 ] To [ 01-13 ]  │
│  Client Contact [ Anabil ] [ 1711086011 ]    │
│  Notes         [ … ]                         │
│                                              │
│         [ Cancel ]   [ Create Project ]      │
└─────────────────────────────────────────────┘
        │
        ▼  on Create:
  ┌───────────────────────────────────────────────────────┐
  │ System auto-generates Cost Code:                       │
  │   26  +  002 (GP's com_num)  +  001 (next seq for GP)  │
  │   →  26002001                                          │
  │ Project Status set to "Ongoing"                        │
  │ Bill Status set to "No Internal Bill"                  │
  │ Audit: created_by=Ohiduzzaman, created_at=now          │
  └───────────────────────────────────────────────────────┘
```

**Why this matters:** in the sheet, `Com Num`, `Project Num`, and `Cost Code (Auto)` are typed/derived by hand and drift. Here the app owns the numbering, so codes are always unique and correct.

**Validation the form enforces (that the sheet doesn't):**
- Client must exist → no free-text typos
- Amounts numeric, dates valid → kills the corrupt-date bug (N8, N144)
- Warn if `Cost > PO Amount` (negative margin)
- PO Number may be blank/"NA" now, but flagged for follow-up

---

## 4. The two pipelines (state machines)

The heart of the sheet is two status columns. In the app they become **guarded transitions** — you can only move forward through valid steps, and each move is logged.

### 4a. Project Status (execution pipeline)

```
  Ongoing ──► Acknowledge ──► Completed ──► Coupa Receiving ──► Client Bill Submitted ──► Payment Received
     │                                                                                          ▲
     └──────────────────────────── (cancel) ──────────────────────────────────────────────────┘
```

### 4b. Internal Bill Status (money pipeline)

```
  No Internal Bill ──► Pending ──► QC ──► Submitted ──► Completed
```

> The app enforces the spelling (`Acknowledge`, not `Acknowlege`; `Client Bill Submitted`, not `Clien bill submitted`) so dashboards stop splitting into fake buckets.

### How an owner moves a project (flow)

```
My Projects → click a project row → Project Detail
        │
        ▼
┌───────────────────────────────────────────────┐
│ 26002001 · GP Daraz Gift Voucher     [ ⋯ ]    │
│ Owner: Ohiduzzaman   Client: GP               │
│                                               │
│ Project Status:  ● Ongoing  →  [ Advance ▾ ]  │  ◄ only shows valid next states
│ Bill Status:     ○ No Internal Bill           │
│                                               │
│ 💰 PO 1,510,519 · Bill 1,510,519 · Cost 1,411,700 → Margin +98,819
│ 📅 Exec 02–13 Jan · Est 03 Jan                │
│ 📞 Anabil · 01711086011                       │
│                                               │
│ [ Documents ]  [ Activity log ]  [ Notes ]    │
└───────────────────────────────────────────────┘
```

---

## 5. My Projects (replaces the 17 person-tabs)

The person tabs were static filtered copies that drift. Here it's **one list, filtered live to `owner = me`.**

```
My Projects — Ohiduzzaman                    [ + New ]  [ ⌗ Board view ]
────────────────────────────────────────────────────────────────────────
Code       Client  Project                Status         Bill        Margin
26002001   GP      Daraz Gift Voucher     Ongoing        —           +98,819
26002007   GP      GP New Year Event      Completed      QC          +…
26002010   GP      GP ME January 2026     Client Bill…   Submitted   +…
────────────────────────────────────────────────────────────────────────
Filters: [ Status ▾ ] [ Client ▾ ] [ Year ▾ ] [ Overdue ▾ ]
```

Board view = the kanban of section 4, cards you drag between status columns.

---

## 6. Billing flow (Finance persona)

```
Billing view = every project not yet "Payment Received", grouped by Bill Status
────────────────────────────────────────────────────────────────────────
  PENDING (5)          QC (3)            SUBMITTED (8)      COMPLETED (…)
  ┌───────────┐        ┌───────────┐     ┌───────────┐
  │ 26003014  │        │ 26002007  │     │ 26004002  │
  │ BAT ·  ▢  │        │ GP ·   ▢  │     │ UBL ·  ▢  │
  └───────────┘        └───────────┘     └───────────┘

Finance opens a card →
   • verifies Bill Amount vs PO Amount
   • advances Bill Status  (Pending → QC → Submitted → Completed)
   • when client pays → sets Project Status = "Payment Received", records Received Date
```

**Alerts Finance would want (impossible in Excel):**
- PO still "NA" after N days
- Payment not received X days past bill submission
- `Cost > PO` (loss-making) flagged red
- Bill Amount ≠ PO Amount mismatch

---

## 7. Documents flow (replaces "Archieve Management")

The Archive tab is a tick-box grid: does each project have its Estimate, PO, Agreement, Photo, Video, AV, Plan, Design, Completion Certificate, etc. In the app it becomes a **checklist with real file uploads**.

```
Project 26002001 → Documents tab
────────────────────────────────────────────
  ✅ Estimate            estimate_v2.pdf
  ✅ PO / Work Order     GP00340359.pdf
  ⬜ Agreement           — (missing)
  ✅ Photo               drive-link / upload
  ⬜ Video               —
  ⬜ AV                  —
  ⬜ Plan                —
  ✅ Design              design_final.ai
  ⬜ Completion Cert.    —   ← blocks "Payment Received"?
  ⬜ Other Project Item
  ⬜ Logistic Item
────────────────────────────────────────────
  Completeness: 4 / 11  ▓▓▓▓░░░░░░░
```

Optional rule: a project can't reach **Payment Received** until the Completion Certificate is uploaded (turns the checklist from passive tracking into a gate).

---

## 8. Dashboard & Reports (replaces the pivot sheets)

The two hidden pivots (`Internal Status Summary`, `Project Status Summary`) become a live dashboard.

```
Dashboard — 2026
┌────────────────────────┬────────────────────────┐
│ Projects by Status     │ Bills by Status         │
│  Ongoing        ▓▓▓ 42 │  No Bill      ▓▓ 30     │
│  Completed      ▓▓ 28  │  Pending      ▓ 12      │
│  Bill Submitted ▓ 15   │  QC           ▓ 9       │
│  Payment Rec'd  ▓ 60   │  Submitted    ▓▓ 25     │
├────────────────────────┴────────────────────────┤
│ 💰 Totals: PO 210M · Billed 198M · Cost 165M     │
│    Gross margin 33M (16%)                         │
│ 🏆 By client: GP · BAT · UBL · BL …               │
│ 👤 By owner:  Shovo 115 · Benson 88 · Ohid 83 …   │
│ ⚠ 6 projects loss-making · 4 PO missing >30d      │
└──────────────────────────────────────────────────┘
```

Reports allow: filter by year (2024/2025/2026), client, owner, status; export back to xlsx/CSV.

---

## 9. Admin flow (replaces the "Cost Code" reference sheet)

```
Admin ⚙
├── Clients        add/edit: name, short code, com_num  (GP=02, BAT=03…)
│                  → com_num drives the cost-code prefix
├── Users/Owners   the 17 people; activate/deactivate, assign default client
├── Cost Codes     view the numbering scheme; per-client next-sequence
├── Statuses       edit the two enum lists (rarely) 
└── Import/Export   one-time migration + ongoing xlsx export
```

Adding a new client here (e.g. "Bata Shoes = 27") is what lets owners then pick it in the New Project form — the same relationship the `Cost Code` sheet encodes today.

---

## 10. One-time migration flow (from the current xlsx)

```
Admin → Import
   1. Upload Project Tracking-2026.xlsx
   2. Map sheet → entity:
        2026            → Projects (2026)
        2025 / 2024     → Projects (older schema → mapped: Cost→cost, Total→bill…)
        Cost Code       → Clients + Users + enums
        Archieve Mgmt   → Documents (by cost code)
        person tabs     → ignored (derived from owner)
        Sheet17/18, Copy→ ignored (empty)
   3. Preview + validation report
        • flags corrupt dates (N8, N144)
        • flags status typos → auto-corrects to canonical enum
        • flags duplicate cost codes
   4. Confirm → load
```

> Note the 2024/25 rows use a **commission-era schema** (Cost, Agency Commission, Creative Charge, VAT, Total, Payment Terms) different from 2026's PO/Bill/Cost model — migration needs an explicit column map, or keep them as read-only archive.

---

## 11. End-to-end happy path (one project, one picture)

```
 Owner                     Owner                 Owner            Finance          Finance
  │ create                  │ execute             │ close          │ bill            │ collect
  ▼                         ▼                     ▼                ▼                ▼
[New Project]──►[Ongoing]──►[Acknowledge]──►[Completed]──►[Coupa Rec.]──►[Client Bill Sub.]──►[Payment Received]
  │  auto code 26002001      upload plan/design    upload photos/    Bill: Pending    Bill: Submitted     record
  │  PO/amounts entered      as they happen        completion cert   →QC→Submitted    →Completed          Received Date
  ▼                                                                                                        ▼
 dashboards & alerts update live at every step ────────────────────────────────────────────────────────► done
```

---

## 12. Open questions (decide before building)

1. **Access model** — do owners see only their own projects, or everyone's (read-only)?
2. **Who owns Bill Status** — Finance only, or owners too?
3. **Documents** — real file uploads, or just links (Google Drive) + a checkbox?
4. **Gates** — should missing documents / negative margin *block* status changes, or just warn?
5. **Old years** — migrate 2024/25 into the same model, or keep as read-only archive?
6. **Notifications** — in-app only, or email/WhatsApp (given client contacts are phone numbers)?
7. **Multi-year** — one rolling table filtered by year, or a fresh space per year like the tabs?

---

*Next step options: turn this into a formal OpenSpec proposal (schema + specs + phased tasks), or keep refining specific flows above.*
