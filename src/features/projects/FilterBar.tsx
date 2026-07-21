import { X } from 'lucide-react'
import { PROJECT_STATUSES } from '../../domain/types'
import { useStore } from '../../store/store'

export function FilterBar() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const clearFilters = useStore((s) => s.clearFilters)
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)

  const active =
    filters.status !== 'all' ||
    filters.clientId !== 'all' ||
    filters.ownerId !== 'all' ||
    filters.overdue ||
    filters.pendingBills

  const sel = 'input w-auto py-1 text-2xs'

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select className={sel} value={filters.status} onChange={(e) => setFilters({ status: e.target.value as never })}>
        <option value="all">All statuses</option>
        {PROJECT_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select className={sel} value={filters.clientId} onChange={(e) => setFilters({ clientId: e.target.value })}>
        <option value="all">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.shortCode}</option>
        ))}
      </select>
      <select className={sel} value={filters.ownerId} onChange={(e) => setFilters({ ownerId: e.target.value })}>
        <option value="all">All owners</option>
        {owners.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-2xs font-medium ${filters.pendingBills ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'border-line text-muted'}`}>
        <input type="checkbox" checked={filters.pendingBills} onChange={(e) => setFilters({ pendingBills: e.target.checked })} className="accent-amber-500" />
        Pending bills
      </label>
      <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-2xs font-medium ${filters.overdue ? 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'border-line text-muted'}`}>
        <input type="checkbox" checked={filters.overdue} onChange={(e) => setFilters({ overdue: e.target.checked })} className="accent-rose-500" />
        Overdue
      </label>
      {active && (
        <button className="btn-ghost px-2 py-1 text-2xs" onClick={clearFilters}>
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
