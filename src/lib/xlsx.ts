import { generateCode } from '../domain/costcode'
import {
  PROJECT_STATUSES,
  type Bill,
  type Client,
  type DataSet,
  type Owner,
  type Project,
  type ProjectStatus,
} from '../domain/types'
import { approvedCost, emptyDocuments } from './format'
import { normalizeDataSet } from './io'

// Canonical column headers used for both export and import.
// "Cost" is the derived total; on import it seeds a single approved bill.
const PROJECT_HEADERS = [
  'Code', 'Client', 'Owner', 'Project Name', 'Estimate Date', 'PO Number',
  'PO Amount', 'Bill Amount', 'Cost', 'Execution From', 'Execution To',
  'Project Status', 'Client Contact', 'Client Cell', 'Notes',
] as const
const REQUIRED = ['Client', 'Project Name', 'PO Amount', 'Cost'] as const

const isoDay = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

// ---- Export -------------------------------------------------------------
export async function exportWorkbook(data: DataSet) {
  const XLSX = await import('xlsx')
  const cById = new Map(data.clients.map((c) => [c.id, c]))
  const oById = new Map(data.owners.map((o) => [o.id, o]))

  const projectRows = data.projects
    .filter((p) => !p.deleted)
    .map((p) => ({
      Code: p.code,
      Client: cById.get(p.clientId)?.shortCode ?? '',
      Owner: oById.get(p.ownerId)?.name ?? '',
      'Project Name': p.name,
      'Estimate Date': isoDay(p.estimateDate),
      'PO Number': p.poNumber,
      'PO Amount': p.poAmount,
      'Bill Amount': p.billAmount,
      Cost: p.cost,
      'Execution From': isoDay(p.executionFrom),
      'Execution To': isoDay(p.executionTo),
      'Project Status': p.projectStatus,
      'Client Contact': p.clientContact,
      'Client Cell': p.clientCell,
      Notes: p.notes,
    }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(projectRows, { header: PROJECT_HEADERS as unknown as string[] }),
    'Projects',
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.clients.map((c) => ({ Name: c.name, 'Short Code': c.shortCode, 'Com Num': c.comNum })),
    ),
    'Clients',
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(data.owners.map((o) => ({ Name: o.name, Active: o.active }))),
    'Owners',
  )
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `project-tracker-${stamp}.xlsx`)
}

// Export whatever rows/columns the table currently shows.
export async function exportTable(
  rows: Record<string, unknown>[],
  filename: string,
  format: 'csv' | 'xlsx',
) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Export')
  XLSX.writeFile(wb, filename, { bookType: format })
}

// ---- Import -------------------------------------------------------------
export interface ImportResult {
  data?: DataSet
  errors: string[]
  warnings: string[]
}

export async function importWorkbook(file: File): Promise<ImportResult> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  let wb
  try {
    wb = XLSX.read(buf, { cellDates: true })
  } catch {
    return { errors: ['Could not read the file as a spreadsheet.'], warnings: [] }
  }

  const projSheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === 'projects') ?? wb.SheetNames[0]
  if (!projSheetName) return { errors: ['Workbook has no sheets.'], warnings: [] }
  const projSheet = wb.Sheets[projSheetName]

  // Validate headers.
  const headerRows = XLSX.utils.sheet_to_json<string[]>(projSheet, { header: 1 })
  const headers = (headerRows[0] as string[] | undefined)?.map((h) => String(h).trim()) ?? []
  const missing = REQUIRED.filter((h) => !headers.includes(h))
  if (missing.length) {
    return {
      errors: [
        `Sheet "${projSheetName}" is missing required column(s): ${missing.join(', ')}.`,
        `Expected columns include: ${PROJECT_HEADERS.join(', ')}.`,
      ],
      warnings: [],
    }
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(projSheet, { defval: '' })
  const warnings: string[] = []

  // Optional Clients / Owners sheets (present in our own exports).
  const clients: Client[] = []
  const clientByKey = new Map<string, Client>() // key by shortCode AND name (lowercased)
  const registerClient = (name: string, shortCode: string, comNum: string) => {
    const c: Client = {
      id: `c-${shortCode.toLowerCase().replace(/\W+/g, '')}-${clients.length}`,
      name: name || shortCode,
      shortCode: shortCode || name,
      comNum: comNum.padStart(2, '0'),
    }
    clients.push(c)
    clientByKey.set(shortCode.toLowerCase(), c)
    clientByKey.set(name.toLowerCase(), c)
    return c
  }

  const clientsSheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'clients')
  if (clientsSheetName) {
    const crows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[clientsSheetName], {
      defval: '',
    })
    crows.forEach((r, i) =>
      registerClient(
        String(r['Name'] ?? ''),
        String(r['Short Code'] ?? r['Name'] ?? ''),
        String(r['Com Num'] ?? String(i + 1)),
      ),
    )
  }

  const owners: Owner[] = []
  const ownerByName = new Map<string, Owner>()
  const registerOwner = (name: string, active = true) => {
    const o: Owner = { id: `o-${name.toLowerCase().replace(/\W+/g, '')}-${owners.length}`, name, active }
    owners.push(o)
    ownerByName.set(name.toLowerCase(), o)
    return o
  }
  const ownersSheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'owners')
  if (ownersSheetName) {
    const orows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[ownersSheetName], {
      defval: '',
    })
    orows.forEach((r) => registerOwner(String(r['Name'] ?? ''), r['Active'] !== false))
  }

  // Build projects, deriving clients/owners on the fly if not pre-registered.
  const projects: Project[] = []
  const toISO = (v: unknown): string | null => {
    if (!v) return null
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString()
    const d = new Date(String(v))
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ''))
    return Number.isNaN(n) ? 0 : n
  }
  const clampStatus = <T,>(v: unknown, allowed: readonly T[], fallback: T): T =>
    (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback

  rows.forEach((r, i) => {
    const clientVal = String(r['Client'] ?? '').trim()
    if (!clientVal) {
      warnings.push(`Row ${i + 2}: blank Client — skipped.`)
      return
    }
    let client = clientByKey.get(clientVal.toLowerCase())
    if (!client) {
      const comNum = String(clients.length + 1)
      client = registerClient(clientVal, clientVal.slice(0, 4).toUpperCase(), comNum)
    }
    const ownerVal = String(r['Owner'] ?? 'Unassigned').trim() || 'Unassigned'
    let owner = ownerByName.get(ownerVal.toLowerCase())
    if (!owner) owner = registerOwner(ownerVal)

    const estimateDate = toISO(r['Estimate Date'])
    const providedCode = String(r['Code'] ?? '').trim()
    const code = providedCode || generateCode(projects, client, estimateDate)
    const nowISO = new Date().toISOString()

    // Seed the derived cost from the "Cost" column as one approved bill.
    const costVal = num(r['Cost'])
    const bills: Bill[] =
      costVal > 0
        ? [
            {
              id: `b-${code}-1`,
              title: 'Imported cost',
              amount: costVal,
              links: [],
              state: 'Approved',
              createdBy: 'import',
              createdAt: nowISO,
              decidedBy: 'import',
              decidedAt: nowISO,
            },
          ]
        : []

    projects.push({
      id: `p-${code}-${i}`,
      code,
      clientId: client.id,
      ownerId: owner.id,
      name: String(r['Project Name'] ?? '').trim(),
      estimateDate,
      poNumber: String(r['PO Number'] ?? '').trim(),
      poAmount: num(r['PO Amount']),
      billAmount: num(r['Bill Amount']),
      cost: approvedCost(bills),
      executionFrom: toISO(r['Execution From']),
      executionTo: toISO(r['Execution To']),
      projectStatus: clampStatus<ProjectStatus>(r['Project Status'], PROJECT_STATUSES, 'Ongoing'),
      clientContact: String(r['Client Contact'] ?? '').trim(),
      clientCell: String(r['Client Cell'] ?? '').trim(),
      notes: String(r['Notes'] ?? '').trim(),
      bills,
      documents: emptyDocuments(),
      activity: [{ at: nowISO, user: 'import', message: `Imported (${code})` }],
      deleted: false,
      createdAt: estimateDate ?? nowISO,
    })
  })

  if (!projects.length) return { errors: ['No project rows found to import.'], warnings }

  return { data: normalizeDataSet({ clients, owners, projects }), errors: [], warnings }
}
