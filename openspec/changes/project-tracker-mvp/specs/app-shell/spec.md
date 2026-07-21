## ADDED Requirements

### Requirement: Application shell and navigation
The application SHALL present a persistent shell consisting of a sidebar navigation and a top bar. The sidebar SHALL provide navigation to Dashboard, My Projects, All Projects, Board, Documents, Reports, and Admin. The top bar SHALL contain global search, the year switch, and the "acting as" switcher.

#### Scenario: Navigating between sections
- **WHEN** the user selects a destination in the sidebar
- **THEN** the main content area renders that section without a full page reload and the active item is highlighted

#### Scenario: Shell persists across sections
- **WHEN** the user moves between sections
- **THEN** the sidebar, top bar, and current "acting as" and year selections remain visible and unchanged

### Requirement: Acting-as user and role switcher
The application SHALL provide an "acting as" switcher that selects the current user (from the loaded owner roster plus an Admin identity) and a role of Admin, Owner, Finance, or Viewer. This switcher SHALL stand in for authentication; no real login is performed.

#### Scenario: Switching the acting user
- **WHEN** the user picks a different person in the "acting as" switcher
- **THEN** views that depend on identity (e.g. My Projects) update to that person and the selection persists across navigation

#### Scenario: Switching role
- **WHEN** the user selects a different role
- **THEN** the UI updates the affordances available to that role (see role-based gating)

### Requirement: Role-based UI gating
The application SHALL show or hide editing affordances based on the active role. Viewer SHALL be read-only. Owner SHALL edit projects and statuses. Finance SHALL edit billing status and payments. Admin SHALL access all actions including reference-data administration. Gating is presentational only and MUST NOT be presented as a security control.

#### Scenario: Viewer cannot edit
- **WHEN** the active role is Viewer
- **THEN** create, edit, delete, and status-change controls are hidden or disabled

#### Scenario: Admin sees admin area
- **WHEN** the active role is Admin
- **THEN** the Admin navigation entry and reference-data actions are available

### Requirement: Year filter
The application SHALL provide a year switch in the top bar that filters all data views to the selected year, using whatever years exist in the currently loaded dataset.

#### Scenario: Changing the active year
- **WHEN** the user selects a different year
- **THEN** project lists, dashboard, and reports show only records for that year

### Requirement: Responsive layout
The application SHALL be usable on a laptop viewport and SHALL degrade gracefully on smaller screens without loss of core functionality.

#### Scenario: Narrow viewport
- **WHEN** the viewport width is reduced to a mobile size
- **THEN** the layout reflows (e.g. collapsible sidebar, horizontally scrollable tables) and all primary actions remain reachable
