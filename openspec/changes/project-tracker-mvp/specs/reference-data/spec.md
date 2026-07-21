## ADDED Requirements

### Requirement: Manage clients
The application SHALL let an Admin view, add, and edit clients, where each client has a name, a short code, and a company number. The company number SHALL feed the cost-code numbering scheme.

#### Scenario: View clients
- **WHEN** an Admin opens the clients admin
- **THEN** all clients are listed with their name, short code, and company number

#### Scenario: Add a client
- **WHEN** an Admin adds a client with a unique company number
- **THEN** the client becomes selectable when creating projects and its company number is used for that client's cost codes

### Requirement: Manage owners
The application SHALL let an Admin view, add, edit, and activate/deactivate owners, where owners are the people a project can be assigned to and that back the "acting as" roster.

#### Scenario: View owners
- **WHEN** an Admin opens the owners admin
- **THEN** all owners are listed with their active state

#### Scenario: Deactivate an owner
- **WHEN** an Admin deactivates an owner
- **THEN** that owner is excluded from new-project owner selection while existing projects retain them

### Requirement: Cost-code numbering scheme
The application SHALL maintain per-client sequence numbering derived from existing projects so that reference-data changes keep generated cost codes consistent and unique.

#### Scenario: New client numbering
- **WHEN** a new client is added and its first project is created
- **THEN** the cost code uses that client's company number with sequence 001
