import { DOCUMENT_TYPES, type Bill, type DocumentItem, type Project } from '../domain/types'

// ---- Money (BDT-style grouping, no currency symbol clutter) -------------
const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

export function money(n: number): string {
  return nf.format(Math.round(n))
}

export function signedMoney(n: number): string {
  const s = money(Math.abs(n))
  return n < 0 ? `−${s}` : `+${s}`
}

// ---- Margin (derived, never stored) -------------------------------------
export interface Margin {
  value: number
  pct: number | null
  loss: boolean
}

export function margin(p: Pick<Project, 'poAmount' | 'cost'>): Margin {
  const value = (p.poAmount || 0) - (p.cost || 0)
  const pct = p.poAmount ? (value / p.poAmount) * 100 : null
  return { value, pct, loss: value < 0 }
}

export function marginPct(m: Margin): string {
  return m.pct === null ? '—' : `${nf2.format(m.pct)}%`
}

// ---- Dates --------------------------------------------------------------
export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

// ---- PO / flags ---------------------------------------------------------
export function missingPO(p: Project): boolean {
  const v = (p.poNumber || '').trim().toUpperCase()
  return v === '' || v === 'NA' || v === 'N/A'
}

// Overdue = client bill submitted but not yet paid after 30 days from execution end.
export function overdue(p: Project): boolean {
  if (p.projectStatus === 'Payment Received') return false
  if (p.projectStatus !== 'Client Bill Submitted') return false
  const d = daysSince(p.executionTo)
  return d !== null && d > 30
}

// ---- Bills → cost -------------------------------------------------------
export function approvedCost(bills: Bill[]): number {
  return bills.filter((b) => b.state === 'Approved').reduce((s, b) => s + b.amount, 0)
}
export function pendingCost(bills: Bill[]): number {
  return bills.filter((b) => b.state === 'Pending').reduce((s, b) => s + b.amount, 0)
}
export function billCounts(bills: Bill[]) {
  return {
    total: bills.length,
    approved: bills.filter((b) => b.state === 'Approved').length,
    pending: bills.filter((b) => b.state === 'Pending').length,
    rejected: bills.filter((b) => b.state === 'Rejected').length,
  }
}

// ---- Documents ----------------------------------------------------------
export function emptyDocuments(): DocumentItem[] {
  return DOCUMENT_TYPES.map((type) => ({ type, present: false }))
}

export function docCompleteness(docs: DocumentItem[]): { done: number; total: number } {
  return { done: docs.filter((d) => d.present).length, total: DOCUMENT_TYPES.length }
}

export function hasAnyDocument(docs: DocumentItem[]): boolean {
  return docs.some((d) => d.present)
}
