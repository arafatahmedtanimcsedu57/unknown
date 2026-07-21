import { ArrowDown, ArrowUp, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProjectStatusPill } from '../../components/StatusPill'
import { MarginBadge } from '../../components/MarginBadge'
import { PROJECT_STATUSES, type Project } from '../../domain/types'
import { billCounts, fmtDate, margin, missingPO, money, overdue } from '../../lib/format'
import { clientName, ownerName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'

type ColKey = 'code' | 'client' | 'name' | 'owner' | 'status' | 'bill' | 'po' | 'margin' | 'exec'

interface Col {
  key: ColKey
  label: string
  align?: 'right'
  defaultOn: boolean
}
const COLS: Col[] = [
  { key: 'code', label: 'Code', defaultOn: true },
  { key: 'client', label: 'Client', defaultOn: true },
  { key: 'name', label: 'Project', defaultOn: true },
  { key: 'owner', label: 'Owner', defaultOn: true },
  { key: 'status', label: 'Status', defaultOn: true },
  { key: 'bill', label: 'Bills', defaultOn: true },
  { key: 'po', label: 'PO Amount', align: 'right', defaultOn: true },
  { key: 'margin', label: 'Margin', align: 'right', defaultOn: true },
  { key: 'exec', label: 'Exec To', align: 'right', defaultOn: false },
]

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const openDetail = useUI((s) => s.openDetail)

  const [visible, setVisible] = useState<Record<ColKey, boolean>>(
    () => Object.fromEntries(COLS.map((c) => [c.key, c.defaultOn])) as Record<ColKey, boolean>,
  )
  const [sort, setSort] = useState<{ key: ColKey; dir: 1 | -1 }>({ key: 'code', dir: 1 })
  const [colMenu, setColMenu] = useState(false)

  const sortVal = (p: Project, key: ColKey): string | number => {
    switch (key) {
      case 'code': return p.code
      case 'client': return clientName(clients, p.clientId)
      case 'name': return p.name.toLowerCase()
      case 'owner': return ownerName(owners, p.ownerId).toLowerCase()
      case 'status': return PROJECT_STATUSES.indexOf(p.projectStatus)
      case 'bill': return billCounts(p.bills).pending * 100 + p.bills.length
      case 'po': return p.poAmount
      case 'margin': return margin(p).value
      case 'exec': return p.executionTo ?? ''
    }
  }

  const sorted = useMemo(() => {
    const arr = [...projects]
    arr.sort((a, b) => {
      const va = sortVal(a, sort.key)
      const vb = sortVal(b, sort.key)
      if (va < vb) return -1 * sort.dir
      if (va > vb) return 1 * sort.dir
      return 0
    })
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, sort])

  const toggleSort = (key: ColKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }))

  const shownCols = COLS.filter((c) => visible[c.key])

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-faint">
          {projects.length} project{projects.length === 1 ? '' : 's'}
        </span>
        <div className="relative">
          <button className="btn-ghost px-2 py-1 text-2xs" onClick={() => setColMenu((v) => !v)} onBlur={() => setTimeout(() => setColMenu(false), 150)}>
            <SlidersHorizontal size={13} /> Columns
          </button>
          {colMenu && (
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-line bg-surface py-1 shadow-pop">
              {COLS.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-raised" onMouseDown={(e) => e.preventDefault()}>
                  <input type="checkbox" checked={visible[c.key]} onChange={() => setVisible((v) => ({ ...v, [c.key]: !v[c.key] }))} className="accent-accent" />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-raised/60">
              {shownCols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-faint hover:text-ink ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sort.key === c.key && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                onClick={() => openDetail(p.id)}
                className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-accent-soft/40"
              >
                {shownCols.map((c) => (
                  <td key={c.key} className={`whitespace-nowrap px-3 py-2 ${c.align === 'right' ? 'text-right' : ''}`}>
                    <Cell p={p} col={c.key} clients={clients} owners={owners} />
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={shownCols.length} className="px-3 py-10 text-center text-sm text-faint">
                  No projects match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cell({
  p,
  col,
  clients,
  owners,
}: {
  p: Project
  col: ColKey
  clients: ReturnType<typeof useStore.getState>['clients']
  owners: ReturnType<typeof useStore.getState>['owners']
}) {
  switch (col) {
    case 'code':
      return (
        <span className="font-mono text-xs text-muted">
          {p.code}
          {missingPO(p) && <span className="ml-1 text-amber-500" title="Missing PO">•</span>}
          {overdue(p) && <span className="ml-1 text-rose-500" title="Overdue">•</span>}
        </span>
      )
    case 'client':
      return <span className="font-medium">{clientName(clients, p.clientId)}</span>
    case 'name':
      return <span className="text-ink">{p.name}</span>
    case 'owner':
      return <span className="text-muted">{ownerName(owners, p.ownerId)}</span>
    case 'status':
      return <ProjectStatusPill status={p.projectStatus} />
    case 'bill': {
      const c = billCounts(p.bills)
      if (c.total === 0) return <span className="text-2xs text-faint">—</span>
      return (
        <span className="font-mono text-2xs text-muted">
          {c.approved}/{c.total}
          {c.pending > 0 && (
            <span className="ml-1 text-amber-500" title={`${c.pending} pending`}>
              ●{c.pending}
            </span>
          )}
        </span>
      )
    }
    case 'po':
      return <span className="font-mono text-xs tabular">{money(p.poAmount)}</span>
    case 'margin':
      return <MarginBadge poAmount={p.poAmount} cost={p.cost} />
    case 'exec':
      return <span className="font-mono text-2xs text-muted">{fmtDate(p.executionTo)}</span>
  }
}
