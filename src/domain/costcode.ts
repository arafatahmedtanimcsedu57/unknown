import type { Client, Project } from './types'

// Cost code = YY + comNum(2) + seq(3), displayed as "26-01-001".
// The store owns numbering so codes stay unique.

export function yearTwoDigits(dateISO: string | null): string {
  const y = dateISO ? new Date(dateISO).getFullYear() : new Date().getFullYear()
  return String(y).slice(-2)
}

export function formatCode(yy: string, comNum: string, seq: number): string {
  return `${yy}-${comNum.padStart(2, '0')}-${String(seq).padStart(3, '0')}`
}

// Next unused sequence for a given client in a given year.
export function nextSequence(projects: Project[], comNum: string, yy: string): number {
  const prefix = `${yy}-${comNum.padStart(2, '0')}-`
  let max = 0
  for (const p of projects) {
    if (p.code.startsWith(prefix)) {
      const seq = parseInt(p.code.slice(prefix.length), 10)
      if (!Number.isNaN(seq) && seq > max) max = seq
    }
  }
  return max + 1
}

export function generateCode(
  projects: Project[],
  client: Client,
  estimateDate: string | null,
): string {
  const yy = yearTwoDigits(estimateDate)
  const seq = nextSequence(projects, client.comNum, yy)
  return formatCode(yy, client.comNum, seq)
}

// Parse the year out of a code for filtering, e.g. "26-01-003" → 2026.
export function codeYear(code: string): number | null {
  const m = /^(\d{2})-/.exec(code)
  if (!m) return null
  return 2000 + parseInt(m[1], 10)
}
