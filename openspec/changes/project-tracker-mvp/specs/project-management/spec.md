## ADDED Requirements

### Requirement: Create a project
The application SHALL allow an Owner or Admin to create a project by entering client, project name, owner, estimate date, PO number, PO amount, bill amount, execution dates, client contact, and notes. Cost is NOT entered directly — it is derived from the project's approved bills. On creation the project SHALL be assigned an initial Project Status of `Ongoing` and SHALL have no bills.

#### Scenario: Successful creation
- **WHEN** the user submits a valid new-project form
- **THEN** the project is added to the working dataset, assigned a generated cost code, given default statuses, and persisted to localStorage

### Requirement: Automatic cost-code generation
The application SHALL generate each project's cost code client-side as the two-digit year, the client's company number, and a per-client sequence number. The generated code MUST be unique, and the per-client sequence MUST increment based on existing projects for that client. Users MUST NOT enter the cost code manually.

#### Scenario: First project for a client
- **WHEN** a project is created for a client whose company number is `01` in year 2026
- **THEN** the generated cost code corresponds to year 26, client 01, sequence 001 (e.g. `26-01-001`)

#### Scenario: Subsequent project for the same client
- **WHEN** another project is created for the same client
- **THEN** the sequence increments to the next unused value for that client and the code remains unique

### Requirement: Live margin calculation
The application SHALL derive and display each project's margin as PO amount minus cost, including a percentage, and SHALL visually distinguish profit from loss. Margin MUST be derived and MUST NOT be stored.

#### Scenario: Positive margin
- **WHEN** a project's PO amount exceeds its cost
- **THEN** the margin is shown as a positive amount and percentage with a profit indicator

#### Scenario: Negative margin
- **WHEN** a project's cost exceeds its PO amount
- **THEN** the margin is shown as negative with a loss indicator

### Requirement: Field validation
The application SHALL validate project input client-side: client must reference an existing client, amounts must be numeric, dates must be valid, and a missing or "NA" PO number is allowed but flagged for follow-up.

#### Scenario: Invalid amount
- **WHEN** the user enters a non-numeric value in an amount field
- **THEN** the form blocks submission and shows a validation message

#### Scenario: Missing PO number
- **WHEN** the user leaves the PO number blank or sets it to "NA"
- **THEN** the project is allowed to save but is flagged as missing a PO

### Requirement: Edit and soft-delete a project
The application SHALL allow editing any project field (subject to role gating) and SHALL support soft-deletion with the ability to restore, so that billed projects are never hard-deleted.

#### Scenario: Edit persists
- **WHEN** the user edits a project and saves
- **THEN** the changes are applied to the working dataset and persisted

#### Scenario: Soft delete and restore
- **WHEN** the user deletes a project and later restores it
- **THEN** the project is hidden from default views while deleted and reappears intact when restored

### Requirement: Project detail view
The application SHALL provide a detail view for a single project showing all its fields, current statuses, margin, its document checklist, and a local activity list of changes.

#### Scenario: Opening a project
- **WHEN** the user opens a project from a list
- **THEN** the detail view shows all fields, statuses, margin, documents, and recorded activity
