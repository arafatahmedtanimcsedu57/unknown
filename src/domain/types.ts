// ---- Canonical status enums (ordered pipelines) -------------------------
// Free-text status is never allowed; these are the only valid values.

export const PROJECT_STATUSES = [
  'Ongoing',
  'Acknowledged',
  'Completed',
  'Coupa Receiving',
  'Client Bill Submitted',
  'Payment Received',
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

// A project has many Bills. Owner creates them (with document links);
// Finance approves or rejects. Approved bills sum into the project's Cost.
export const BILL_STATES = ['Pending', 'Approved', 'Rejected'] as const
export type BillState = (typeof BILL_STATES)[number]

export interface Bill {
  id: string
  title: string
  amount: number
  links: string[] // document links (at least one required)
  state: BillState
  createdBy: string
  createdAt: string
  decidedBy?: string // Finance who approved/rejected
  decidedAt?: string
  note?: string // reason when sent back
}

// ---- Roles (fake-auth; presentational gating only) ----------------------
export const ROLES = ['Admin', 'Owner', 'Finance', 'Viewer'] as const
export type Role = (typeof ROLES)[number]

// ---- Document checklist (fixed 11 types) --------------------------------
export const DOCUMENT_TYPES = [
  'Estimate',
  'PO/Work Order',
  'Agreement',
  'Photo',
  'Video',
  'AV',
  'Plan',
  'Design',
  'Completion Certificate',
  'Other Project Item',
  'Logistic Item',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface DocumentItem {
  type: DocumentType
  present: boolean
  link?: string
}

export interface ActivityEntry {
  at: string // ISO timestamp
  user: string
  message: string
}

// ---- Entities -----------------------------------------------------------
export interface Client {
  id: string
  name: string
  shortCode: string
  comNum: string // two-digit company number, drives cost codes
}

export interface Owner {
  id: string
  name: string
  active: boolean
}

export interface Project {
  id: string
  code: string // generated cost code, e.g. 26-01-001
  clientId: string
  ownerId: string
  name: string
  estimateDate: string | null // ISO date
  poNumber: string // may be "" or "NA"
  poAmount: number
  billAmount: number
  cost: number // DERIVED cache = sum of approved bills; recomputed on bill changes
  executionFrom: string | null
  executionTo: string | null
  projectStatus: ProjectStatus
  clientContact: string
  clientCell: string
  notes: string
  bills: Bill[]
  documents: DocumentItem[]
  activity: ActivityEntry[]
  deleted: boolean
  createdAt: string
}

// Shape persisted / imported / exported.
export interface DataSet {
  clients: Client[]
  owners: Owner[]
  projects: Project[]
}
