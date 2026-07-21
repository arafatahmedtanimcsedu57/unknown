## ADDED Requirements

### Requirement: Per-project document checklist
The application SHALL provide, for each project, a checklist of a fixed set of 11 document types: Estimate, PO/Work Order, Agreement, Photo, Video, AV, Plan, Design, Completion Certificate, Other Project Item, and Logistic Item. Each item SHALL track a present/absent state.

#### Scenario: Marking a document present
- **WHEN** the user marks a checklist item as present
- **THEN** the item's state updates on the project and is persisted to localStorage

### Requirement: Document link (no upload)
The application SHALL allow attaching an external URL link to each checklist item instead of uploading a file. No file upload or file storage SHALL occur.

#### Scenario: Attaching a link
- **WHEN** the user pastes a URL for a checklist item
- **THEN** the link is saved on that item and is openable from the checklist

### Requirement: Completeness indicator
The application SHALL display a completeness indicator summarizing how many of the checklist items are present out of the total.

#### Scenario: Completeness updates
- **WHEN** the user changes the present/absent state of any checklist item
- **THEN** the completeness indicator (e.g. "4 / 11") updates accordingly
