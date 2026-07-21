import { codeYear } from '../domain/costcode'
import {
  BILL_STATES,
  PROJECT_STATUSES,
  type BillState,
  type Client,
  type Owner,
  type Project,
  type ProjectStatus,
} from '../domain/types'
import { margin, missingPO, overdue } from '../lib/format'
import { useShallow } from 'zustand/react/shallow'
import { type Filters, useStore } from './store'

// ---- Lookups ------------------------------------------------------------
export const clientMap = (clients: Client[]) => new Map(clients.map((c) => [c.id, c]))
export const ownerMap = (owners: Owner[]) => new Map(owners.map((o) => [o.id, o]))

export function clientName(clients: Client[], id: string) {
  return clients.find((c) => c.id === id)?.shortCode ?? '—'
}
export function ownerName(owners: Owner[], id: string) {
  return owners.find((o) => o.id === id)?.name ?? '—'
}

// ---- Filtering ----------------------------------------------------------
export interface FilterCtx {
  year: number | 'all'
  filters: Filters
  search: string
  clients: Client[]
  owners: Owner[]
  ownerScope?: string // limit to a single owner (My Projects)
  includeDeleted?: boolean
}

export function applyFilters(projects: Project[], ctx: FilterCtx): Project[] {
  const q = ctx.search.trim().toLowerCase()
  const cById = clientMap(ctx.clients)
  return projects.filter((p) => {
    if (!ctx.includeDeleted && p.deleted) return false
    if (ctx.ownerScope && p.ownerId !== ctx.ownerScope) return false
    if (ctx.year !== 'all' && codeYear(p.code) !== ctx.year) return false
    if (ctx.filters.status !== 'all' && p.projectStatus !== ctx.filters.status) return false
    if (ctx.filters.clientId !== 'all' && p.clientId !== ctx.filters.clientId) return false
    if (ctx.filters.ownerId !== 'all' && p.ownerId !== ctx.filters.ownerId) return false
    if (ctx.filters.overdue && !overdue(p)) return false
    if (ctx.filters.pendingBills && !p.bills.some((b) => b.state === 'Pending')) return false
    if (q) {
      const client = cById.get(p.clientId)
      const hay = `${p.code} ${p.name} ${client?.name ?? ''} ${client?.shortCode ?? ''} ${p.clientContact}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

// ---- Aggregation (dashboard) --------------------------------------------
export interface Aggregates {
  count: number
  totalPO: number
  totalBilled: number
  totalCost: number
  totalMargin: number
  byProjectStatus: { key: ProjectStatus; count: number }[]
  byBillState: { key: BillState; count: number }[]
  byClient: { id: string; label: string; count: number; margin: number }[]
  byOwner: { id: string; label: string; count: number }[]
  alerts: { kind: 'loss' | 'po' | 'overdue'; project: Project }[]
}

export function aggregate(projects: Project[], clients: Client[], owners: Owner[]): Aggregates {
  let totalPO = 0
  let totalBilled = 0
  let totalCost = 0
  const ps = new Map<ProjectStatus, number>()
  const bs = new Map<BillState, number>()
  const cl = new Map<string, { count: number; margin: number }>()
  const ow = new Map<string, number>()
  const alerts: Aggregates['alerts'] = []

  for (const p of projects) {
    totalPO += p.poAmount
    totalBilled += p.billAmount
    totalCost += p.cost
    ps.set(p.projectStatus, (ps.get(p.projectStatus) ?? 0) + 1)
    for (const b of p.bills) bs.set(b.state, (bs.get(b.state) ?? 0) + 1)
    const m = margin(p)
    const clAgg = cl.get(p.clientId) ?? { count: 0, margin: 0 }
    cl.set(p.clientId, { count: clAgg.count + 1, margin: clAgg.margin + m.value })
    ow.set(p.ownerId, (ow.get(p.ownerId) ?? 0) + 1)

    if (m.loss) alerts.push({ kind: 'loss', project: p })
    if (missingPO(p)) alerts.push({ kind: 'po', project: p })
    if (overdue(p)) alerts.push({ kind: 'overdue', project: p })
  }

  return {
    count: projects.length,
    totalPO,
    totalBilled,
    totalCost,
    totalMargin: totalPO - totalCost,
    byProjectStatus: PROJECT_STATUSES.map((key) => ({ key, count: ps.get(key) ?? 0 })),
    byBillState: BILL_STATES.map((key) => ({ key, count: bs.get(key) ?? 0 })),
    byClient: clients
      .map((c) => ({ id: c.id, label: c.shortCode, ...(cl.get(c.id) ?? { count: 0, margin: 0 }) }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
    byOwner: owners
      .map((o) => ({ id: o.id, label: o.name, count: ow.get(o.id) ?? 0 }))
      .filter((o) => o.count > 0)
      .sort((a, b) => b.count - a.count),
    alerts,
  }
}

// ---- Convenience hooks --------------------------------------------------
export function useActingUser() {
  return useStore((s) => s.owners.find((o) => o.id === s.actingUserId) ?? null)
}

export function useYears() {
  return useStore(
    useShallow((s) => {
      const set = new Set<number>()
      for (const p of s.projects) {
        const y = codeYear(p.code)
        if (y) set.add(y)
      }
      return [...set].sort((a, b) => b - a)
    }),
  )
}
