import { BILL_STATE_TONE, PROJECT_STATUS_TONE, TONE_CLASSES } from '../domain/status'
import type { BillState, ProjectStatus } from '../domain/types'

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  return <Pill label={status} tone={PROJECT_STATUS_TONE[status]} />
}

export function BillStatePill({ state }: { state: BillState }) {
  return <Pill label={state} tone={BILL_STATE_TONE[state]} />
}

function Pill({ label, tone }: { label: string; tone: keyof typeof TONE_CLASSES }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
