import { formatCode } from '../domain/costcode'
import {
  DOCUMENT_TYPES,
  PROJECT_STATUSES,
  type Bill,
  type Client,
  type DataSet,
  type DocumentItem,
  type Owner,
  type Project,
  type ProjectStatus,
} from '../domain/types'
import { approvedCost } from '../lib/format'

// Deterministic PRNG so the "fictional sample" is stable across loads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260721)
const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))

// ---- Fictional reference data (NOT from any real spreadsheet) ------------
const CLIENTS: Client[] = [
  { id: 'c-acme', name: 'Acme Industries', shortCode: 'AC', comNum: '01' },
  { id: 'c-globex', name: 'Globex Corporation', shortCode: 'GBX', comNum: '02' },
  { id: 'c-initech', name: 'Initech Systems', shortCode: 'INI', comNum: '03' },
  { id: 'c-umbrella', name: 'Umbrella Group', shortCode: 'UMB', comNum: '04' },
  { id: 'c-contoso', name: 'Contoso Ltd.', shortCode: 'CTS', comNum: '05' },
  { id: 'c-northwind', name: 'Northwind Traders', shortCode: 'NW', comNum: '06' },
]

const OWNERS: Owner[] = [
  { id: 'o-alex', name: 'Alex Morgan', active: true },
  { id: 'o-priya', name: 'Priya Nair', active: true },
  { id: 'o-sam', name: 'Sam Carter', active: true },
  { id: 'o-lena', name: 'Lena Ortiz', active: true },
  { id: 'o-diego', name: 'Diego Santos', active: true },
  { id: 'o-mei', name: 'Mei Chen', active: true },
  { id: 'o-omar', name: 'Omar Farooq', active: true },
  { id: 'o-nadia', name: 'Nadia Haque', active: false },
]

// Realistic skew: how many projects each client gets (sums to 40).
const CLIENT_LOAD: Record<string, number> = {
  'c-acme': 10,
  'c-globex': 8,
  'c-initech': 7,
  'c-umbrella': 6,
  'c-contoso': 5,
  'c-northwind': 4,
}

const PROJECT_NAMES = [
  'Annual Sales Conference',
  'Product Launch Event',
  'Brand Activation Q1',
  'National Dealer Meet',
  'Town Hall Setup',
  'City Roadshow',
  'Gift Voucher Fulfilment',
  'Trade Fair Booth',
  'Employee Engagement Day',
  'New Year Gala',
  'Photo & Video Shoot',
  'Stage & AV Setup',
  'Merchandise Production',
  'Corporate Offsite',
  'Annual Awards Night',
  'CSR Field Campaign',
  'Retail Visibility Drive',
  'Leadership Summit',
  'Festival Sampling',
  'Customer Loyalty Meet',
  'Partner Onboarding',
  'Regional Kickoff',
  'Warehouse Inauguration',
  'Influencer Meetup',
]

const CONTACTS = [
  'Rahul Sen',
  'Farah Ahmed',
  'Nabil Karim',
  'Tania Roy',
  'Imran Hossain',
  'Sara Malik',
  'Kabir Das',
  'Mina Alam',
]

const BILL_TITLES = [
  'Venue rental',
  'Stage & lighting',
  'Catering & refreshments',
  'AV crew',
  'Printing & signage',
  'Logistics & transport',
  'Manpower & hostess',
  'Production materials',
]
const FINANCE_NAME = 'Farida (Finance)'

// Split a project's cost into 1–3 vendor bills; mostly approved, sometimes
// one left Pending so Finance has something to act on.
function makeBills(code: string, total: number, owner: string, when: string, allApproved: boolean): Bill[] {
  const n = between(1, 3)
  const bills: Bill[] = []
  let remaining = total
  for (let i = 0; i < n; i++) {
    const last = i === n - 1
    const amount = Math.max(1000, last ? remaining : Math.round(total / n))
    remaining -= amount
    const pending = !allApproved && last && rnd() > 0.5
    bills.push({
      id: `b-${code}-${i + 1}`,
      title: pick(BILL_TITLES),
      amount,
      links: [`https://drive.example.com/bill/${code}-${i + 1}`],
      state: pending ? 'Pending' : 'Approved',
      createdBy: owner,
      createdAt: when,
      decidedBy: pending ? undefined : FINANCE_NAME,
      decidedAt: pending ? undefined : when,
    })
  }
  return bills
}

function makeDocuments(fill: number): DocumentItem[] {
  return DOCUMENT_TYPES.map((type, i) => ({
    type,
    present: i < fill,
    link: i < fill && rnd() > 0.5 ? 'https://drive.example.com/doc' : undefined,
  }))
}

function isoDate(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString()
}

export function generateSample(): DataSet {
  const projects: Project[] = []
  const seqByClient: Record<string, number> = {}

  // Owner distribution — weight the first owners heavier for realistic skew.
  const ownerPool = [
    'o-alex', 'o-alex', 'o-alex',
    'o-priya', 'o-priya',
    'o-sam', 'o-sam',
    'o-lena', 'o-lena',
    'o-diego',
    'o-mei',
    'o-omar',
  ]

  for (const client of CLIENTS) {
    const count = CLIENT_LOAD[client.id] ?? 4
    for (let n = 0; n < count; n++) {
      const idx = projects.length
      const year = rnd() > 0.15 ? 2026 : 2025
      const yy = String(year).slice(-2)
      const seq = (seqByClient[client.comNum] = (seqByClient[client.comNum] ?? 0) + 1)
      const code = formatCode(yy, client.comNum, seq)

      const month = between(1, year === 2026 ? 7 : 12)
      const day = between(1, 27)
      const estimate = isoDate(year, month, day)
      const execFrom = isoDate(year, month, Math.min(day + between(2, 10), 28))
      const execTo = isoDate(year, month, Math.min(day + between(11, 20), 28))

      // Money: PO 200k–6M, cost normally below PO.
      const poAmount = between(20, 600) * 10000
      let intendedCost = Math.round(poAmount * (0.55 + rnd() * 0.3))
      const billAmount = rnd() > 0.2 ? poAmount : Math.round(poAmount * (0.9 + rnd() * 0.1))

      let projectStatus: ProjectStatus = pick(PROJECT_STATUSES)
      let poNumber = `${client.shortCode}${between(100000, 999999)}`
      let lossMaking = false
      let execToFinal = execTo

      // ---- Baked-in edge cases -----------------------------------------
      if (idx === 3 || idx === 17 || idx === 29) {
        intendedCost = Math.round(poAmount * (1.05 + rnd() * 0.15)) // loss-making
        lossMaking = true
      }
      if (idx === 6 || idx === 21 || idx === 33) {
        poNumber = 'NA' // missing PO
      }
      if (idx === 9 || idx === 24) {
        projectStatus = 'Client Bill Submitted'
        execToFinal = isoDate(2026, 2, 15) // old date → overdue
      }

      const ownerId = ownerPool[idx % ownerPool.length]
      const ownerName = OWNERS.find((o) => o.id === ownerId)?.name ?? 'Owner'
      const bills = makeBills(code, intendedCost, ownerName, estimate, lossMaking)

      projects.push({
        id: `p-${code}`,
        code,
        clientId: client.id,
        ownerId,
        name: pick(PROJECT_NAMES),
        estimateDate: estimate,
        poNumber,
        poAmount,
        billAmount,
        cost: approvedCost(bills),
        executionFrom: execFrom,
        executionTo: execToFinal,
        projectStatus,
        clientContact: pick(CONTACTS),
        clientCell: `01${between(300000000, 999999999)}`,
        notes: '',
        bills,
        documents: makeDocuments(between(2, 9)),
        activity: [{ at: estimate, user: 'system', message: `Project created with code ${code}` }],
        deleted: false,
        createdAt: estimate,
      })
    }
  }

  return { clients: CLIENTS, owners: OWNERS, projects }
}
