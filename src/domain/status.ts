import { PROJECT_STATUSES, type BillState, type ProjectStatus } from './types'

// Semantic tone per status → drives the StatusPill color.
export type Tone = 'slate' | 'blue' | 'amber' | 'violet' | 'green' | 'red' | 'zinc'

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  Ongoing: 'slate',
  Acknowledged: 'violet',
  Completed: 'blue',
  'Coupa Receiving': 'amber',
  'Client Bill Submitted': 'amber',
  'Payment Received': 'green',
}

export const BILL_STATE_TONE: Record<BillState, Tone> = {
  Pending: 'amber',
  Approved: 'green',
  Rejected: 'red',
}

export const TONE_CLASSES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20',
  blue: 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20',
  amber: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
  violet: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
  red: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20',
  zinc: 'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:ring-zinc-400/15',
}

// Valid next states = adjacent forward/back in the ordered pipeline.
// Admin override allows jumping to any state.
function neighbors<T>(list: readonly T[], current: T): T[] {
  const i = list.indexOf(current)
  const out: T[] = []
  if (i > 0) out.push(list[i - 1])
  if (i >= 0 && i < list.length - 1) out.push(list[i + 1])
  return out
}

export function nextProjectStatuses(current: ProjectStatus, admin: boolean): ProjectStatus[] {
  return admin ? PROJECT_STATUSES.filter((s) => s !== current) : neighbors(PROJECT_STATUSES, current)
}

export function isValidProjectTransition(from: ProjectStatus, to: ProjectStatus, admin: boolean) {
  return nextProjectStatuses(from, admin).includes(to)
}
