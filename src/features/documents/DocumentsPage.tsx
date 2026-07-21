import { useMemo } from 'react'
import { docCompleteness } from '../../lib/format'
import { applyFilters, clientName, ownerName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'
import { FilterBar } from '../projects/FilterBar'

export function DocumentsPage() {
  const projects = useStore((s) => s.projects)
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const filters = useStore((s) => s.filters)
  const year = useStore((s) => s.year)
  const search = useStore((s) => s.search)
  const openDetail = useUI((s) => s.openDetail)

  const filtered = useMemo(
    () => applyFilters(projects, { year, filters, search, clients, owners }),
    [projects, year, filters, search, clients, owners],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted">Document completeness per project. Open a project to edit its checklist.</p>
      </div>
      <FilterBar />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-raised/60 text-2xs uppercase tracking-wider text-faint">
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 text-left">Completeness</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const { done, total } = docCompleteness(p.documents)
                const pct = Math.round((done / total) * 100)
                return (
                  <tr
                    key={p.id}
                    onClick={() => openDetail(p.id)}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-accent-soft/40"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted">{p.code}</td>
                    <td className="px-3 py-2 font-medium">{clientName(clients, p.clientId)}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-muted">{ownerName(owners, p.ownerId)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                          <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-2xs tabular text-faint">{done}/{total}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
