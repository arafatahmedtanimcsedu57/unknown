## ADDED Requirements

### Requirement: Project status pipeline
The application SHALL model Project Status as a fixed, canonical enum with the ordered values `Ongoing`, `Acknowledged`, `Completed`, `Coupa Receiving`, `Client Bill Submitted`, and `Payment Received`. Free-text status entry MUST NOT be allowed.

#### Scenario: Only canonical values
- **WHEN** a project's Project Status is set
- **THEN** it can only take one of the defined canonical values, preventing typo-driven duplicate categories

### Requirement: Bills belong to a project
The application SHALL model billing as a collection of Bills attached to each project, rather than a single status. Each Bill SHALL have a title, an amount, one or more document links, a state of `Pending`, `Approved`, or `Rejected`, and records of who created it and who decided it. An Owner MAY create multiple bills on a project, and the full bill history SHALL remain attached to the project.

#### Scenario: Owner raises a bill
- **WHEN** an Owner adds a bill with a title, amount, and at least one document link
- **THEN** a new Bill is created in state `Pending` and appears in the project's bill history

#### Scenario: Document link required
- **WHEN** an Owner attempts to raise a bill with no document link
- **THEN** the action is blocked until at least one link is provided

### Requirement: Finance approves bills
A Finance user (or Admin) SHALL be able to approve or send back (reject) a `Pending` bill; an Owner SHALL NOT approve bills, and Finance SHALL NOT edit project fields or amounts. Each decision SHALL record the deciding user and a timestamp in the bill and the project activity.

#### Scenario: Approve a pending bill
- **WHEN** a Finance user approves a `Pending` bill
- **THEN** the bill becomes `Approved`, the deciding user and time are recorded, and the project cost updates

#### Scenario: Owner cannot approve
- **WHEN** an Owner views a `Pending` bill
- **THEN** no approve action is available to them

### Requirement: Project cost is the sum of approved bills
The application SHALL derive each project's Cost as the sum of its `Approved` bills, and SHALL recompute it whenever bills change. Pending and rejected bills SHALL NOT count toward Cost. There SHALL be no manually entered Cost field.

#### Scenario: Cost increments on approval
- **WHEN** a bill is approved
- **THEN** the project's Cost increases by that bill's amount and Margin (PO − Cost) is recalculated

#### Scenario: Pending bill excluded from cost
- **WHEN** a bill is `Pending`
- **THEN** its amount is shown but is not included in the project's Cost

### Requirement: Status pills
The application SHALL render each project status and each bill state as a color-coded pill so they are visually scannable in tables, the board, and detail views.

#### Scenario: Color-coded display
- **WHEN** a project is displayed
- **THEN** its Project Status appears as a colored pill and each bill shows a colored state pill

### Requirement: Guarded transitions with timestamps
The application SHALL restrict status changes to valid next states in each pipeline (with an Admin override), and SHALL record a local timestamp and the acting user for each status change in the project's activity list.

#### Scenario: Valid transition
- **WHEN** an Owner advances a project to the next valid status
- **THEN** the status updates and a timestamped activity entry is recorded

#### Scenario: Invalid transition blocked
- **WHEN** a non-admin attempts to skip to a non-adjacent status
- **THEN** the transition is not offered or is rejected

### Requirement: Kanban board
The application SHALL provide a board view with columns for the pipeline statuses where projects appear as cards that can be dragged between columns, updating their status and persisting the change.

#### Scenario: Drag to change status
- **WHEN** the user drags a project card from one status column to another valid column
- **THEN** the project's status updates, an activity entry is recorded, and the change is persisted
