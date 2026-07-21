## ADDED Requirements

### Requirement: All Projects table
The application SHALL present an All Projects table showing, at minimum, cost code, client, project name, owner, project status, bill status, and margin. The table SHALL support sorting by column and showing/hiding columns, with a sticky header.

#### Scenario: Sorting
- **WHEN** the user clicks a sortable column header
- **THEN** the table reorders by that column and toggles ascending/descending on repeat clicks

#### Scenario: Column visibility
- **WHEN** the user hides a column
- **THEN** that column is removed from the view and the preference is retained during the session

### Requirement: My Projects view
The application SHALL provide a My Projects view that automatically filters the project list to the current "acting as" user, replacing the need for per-owner copies. It SHALL offer a quick "New" action pre-filled with the acting user as owner.

#### Scenario: Filtered to acting user
- **WHEN** the user opens My Projects
- **THEN** only projects owned by the current acting user are listed

#### Scenario: Follows acting-as change
- **WHEN** the acting user changes
- **THEN** My Projects updates to the newly selected user's projects

### Requirement: Filtering
The application SHALL provide filters for status, client, owner, year, and an "overdue" facet, combinable so that multiple filters narrow the list together. All filtering SHALL occur client-side.

#### Scenario: Combined filters
- **WHEN** the user selects a client filter and a status filter
- **THEN** the list shows only projects matching both conditions

### Requirement: Search
The application SHALL provide a text search that matches across cost code, project name, client, and client contact.

#### Scenario: Search by code
- **WHEN** the user types part of a cost code into search
- **THEN** the list narrows to projects whose code, name, client, or contact matches the query
