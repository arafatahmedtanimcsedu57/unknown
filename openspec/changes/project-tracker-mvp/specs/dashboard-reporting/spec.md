## ADDED Requirements

### Requirement: Status distribution charts
The application SHALL display, on the dashboard, a projects-by-Project-Status chart and a bills-by-Bill-Status chart, computed client-side from the currently filtered dataset.

#### Scenario: Charts reflect data
- **WHEN** the dashboard is viewed
- **THEN** it shows counts of projects grouped by Project Status and by Bill Status for the active year and filters

### Requirement: Money KPIs
The application SHALL display top-line KPIs summing PO amount, bill amount, cost, and derived margin across the filtered dataset.

#### Scenario: KPI totals
- **WHEN** the dashboard is viewed
- **THEN** it shows total PO, total billed, total cost, and total margin for the current selection

### Requirement: Client and owner breakdowns
The application SHALL provide breakdowns of project counts and/or amounts grouped by client and by owner.

#### Scenario: Breakdown by owner
- **WHEN** the user views the owner breakdown
- **THEN** projects are grouped and counted per owner for the current selection

### Requirement: Alerts panel
The application SHALL show an alerts list that surfaces loss-making projects (cost exceeds PO), projects missing a PO number, and payment-overdue projects based on dates.

#### Scenario: Loss-making alert
- **WHEN** a project's cost exceeds its PO amount
- **THEN** it appears in the alerts list flagged as loss-making

#### Scenario: Missing PO alert
- **WHEN** a project has no PO number or "NA"
- **THEN** it appears in the alerts list flagged as missing a PO
