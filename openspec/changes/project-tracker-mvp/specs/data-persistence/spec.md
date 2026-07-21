## ADDED Requirements

### Requirement: Bundled fictional sample on first run
On first run with no stored data, the application SHALL load a bundled fictional dataset of 6 clients, 8 owners, and approximately 40 projects. The bundled data MUST be fictional and MUST NOT contain any data from the inspiration spreadsheet.

#### Scenario: First run with empty storage
- **WHEN** the app starts and localStorage contains no saved state
- **THEN** the app hydrates its state from the bundled fictional sample and shows populated tables and dashboard

### Requirement: Client-side persistence
The application SHALL persist the working dataset and light session preferences to the browser's localStorage under a versioned key, and SHALL restore them on subsequent loads. No data SHALL be sent to any server.

#### Scenario: Edits survive refresh
- **WHEN** the user edits data and reloads the page
- **THEN** the previously edited state is restored from localStorage

#### Scenario: Version mismatch
- **WHEN** the stored data uses an incompatible older version key
- **THEN** the app safely re-initializes from the bundled sample rather than crashing

### Requirement: Import a different xlsx as data source
The application SHALL allow importing a different xlsx file, parsed entirely in the browser, to replace the working dataset. The importer SHALL validate that expected column headers are present and SHALL report mismatches to the user. The import SHALL be all-or-nothing: it MUST NOT partially corrupt the existing working set. The imported file MUST NOT be uploaded or stored as a file.

#### Scenario: Valid xlsx import
- **WHEN** the user imports an xlsx whose columns match the expected project shape
- **THEN** the app parses it in-browser, replaces the working dataset, and persists it to localStorage

#### Scenario: Invalid xlsx import
- **WHEN** the user imports an xlsx with missing or unrecognized required columns
- **THEN** the app shows a clear validation report and leaves the current working dataset unchanged

### Requirement: Import and export JSON
The application SHALL export the current working state as a downloadable JSON file and SHALL import a previously exported JSON file to replace the working state, enabling portability across browsers and devices.

#### Scenario: Export JSON
- **WHEN** the user chooses "Export JSON"
- **THEN** the browser downloads a JSON file representing the full current state

#### Scenario: Import JSON
- **WHEN** the user imports a valid exported JSON file
- **THEN** the app replaces the working state with its contents and persists it

### Requirement: Reset to bundled sample
The application SHALL provide a reset action that clears stored data and re-hydrates from the bundled fictional sample.

#### Scenario: Reset
- **WHEN** the user confirms "Reset to sample"
- **THEN** localStorage is cleared and the state is reloaded from the bundled fictional sample

### Requirement: Export table to CSV or xlsx
The application SHALL allow exporting the current project table view to CSV or xlsx for use in external tools.

#### Scenario: Export current table
- **WHEN** the user chooses to export the visible project table
- **THEN** the browser downloads a CSV or xlsx file reflecting the current filters and columns
