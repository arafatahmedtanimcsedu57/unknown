import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { MarginBadge } from '../../components/MarginBadge'
import { billCounts, margin, money } from '../../lib/format'
import { exportTable } from '../../lib/xlsx'
import { applyFilters, clientName, ownerName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { FilterBar } from '../projects/FilterBar'

export function Reports() {
  const projects = useStore((s) => s.projects)
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const filters = useStore((s) => s.filters)
  const year = useStore((s) => s.year)
  const search = useStore((s) => s.search)

  const filtered = useMemo(
    () => applyFilters(projects, { year, filters, search, clients, owners }),
    [projects, year, filters, search, clients, owners],
  )

  // Money rollups grouped by client.
  const byClient = useMemo(() => {
    const map = new Map<string, { count: number; po: number; billed: number; cost: number }>()
    for (const p of filtered) {
      const a = map.get(p.clientId) ?? { count: 0, po: 0, billed: 0, cost: 0 }
      a.count++
      a.po += p.poAmount
      a.billed += p.billAmount
      a.cost += p.cost
      map.set(p.clientId, a)
    }
    return [...map.entries()]
      .map(([id, a]) => ({ id, label: clientName(clients, id), ...a, margin: a.po - a.cost }))
      .sort((x, y) => y.po - x.po)
  }, [filtered, clients])

  const doExport = () => {
    const rows = filtered.map((p) => ({
      Code: p.code,
      Client: clientName(clients, p.clientId),
      Owner: ownerName(owners, p.ownerId),
      Project: p.name,
      'PO Amount': p.poAmount,
      'Bill Amount': p.billAmount,
      Cost: p.cost,
      Margin: margin(p).value,
      'Project Status': p.projectStatus,
      Bills: `${billCounts(p.bills).approved}/${p.bills.length}`,
    }))
    exportTable(rows, `report-${year}.xlsx`, 'xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted">Money rollups by client. Export the filtered set to xlsx.</p>
        </div>
        <button className="btn-outline" onClick={doExport} disabled={!filtered.length}>
          <Download size={15} /> Export xlsx
        </button>
      </div>
      <FilterBar />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line bg-raised/60 text-2xs uppercase tracking-wider text-faint">
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-right">Projects</th>
                <th className="px-3 py-2 text-right">PO</th>
                <th className="px-3 py-2 text-right">Billed</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {byClient.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 font-medium">{c.label}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular">{c.count}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular">{money(c.po)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular">{money(c.billed)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular">{money(c.cost)}</td>
                  <td className="px-3 py-2 text-right"><MarginBadge poAmount={c.po} cost={c.cost} /></td>
                </tr>
              ))}
              {byClient.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-faint">No data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
