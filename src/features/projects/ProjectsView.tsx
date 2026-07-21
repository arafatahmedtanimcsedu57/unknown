import { Download, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { FilterBar } from './FilterBar'
import { ProjectsTable } from './ProjectsTable'
import { billCounts, fmtDate, margin, money } from '../../lib/format'
import { exportTable } from '../../lib/xlsx'
import { applyFilters, clientName, ownerName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'

export function ProjectsView({ scope }: { scope: 'all' | 'mine' }) {
  const projects = useStore((s) => s.projects)
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const filters = useStore((s) => s.filters)
  const year = useStore((s) => s.year)
  const search = useStore((s) => s.search)
  const actingUserId = useStore((s) => s.actingUserId)
  const role = useStore((s) => s.role)
  const openCreate = useUI((s) => s.openCreate)

  const filtered = useMemo(
    () =>
      applyFilters(projects, {
        year,
        filters,
        search,
        clients,
        owners,
        ownerScope: scope === 'mine' ? actingUserId : undefined,
      }),
    [projects, year, filters, search, clients, owners, scope, actingUserId],
  )

  const canEdit = role === 'Admin' || role === 'Owner'
  const title = scope === 'mine' ? 'My Projects' : 'All Projects'

  const doExport = () => {
    const rows = filtered.map((p) => ({
      Code: p.code,
      Client: clientName(clients, p.clientId),
      Project: p.name,
      Owner: ownerName(owners, p.ownerId),
      'PO Amount': money(p.poAmount),
      Cost: money(p.cost),
      Margin: margin(p).value,
      Status: p.projectStatus,
      Bills: `${billCounts(p.bills).approved}/${p.bills.length}`,
      'Exec To': fmtDate(p.executionTo),
    }))
    exportTable(rows, `${scope}-projects.csv`, 'csv')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted">
            {scope === 'mine'
              ? 'Projects owned by the current acting user.'
              : 'Every project across all clients and owners.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={doExport} disabled={!filtered.length}>
            <Download size={15} /> Export
          </button>
          {canEdit && (
            <button className="btn-primary" onClick={() => openCreate(scope === 'mine' ? actingUserId : undefined)}>
              <Plus size={15} /> New Project
            </button>
          )}
        </div>
      </div>

      <FilterBar />
      <ProjectsTable projects={filtered} />
    </div>
  )
}
