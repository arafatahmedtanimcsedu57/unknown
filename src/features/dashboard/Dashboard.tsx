import { AlertTriangle, FileWarning, TrendingDown } from 'lucide-react'
import { useMemo } from 'react'
import { BarList } from '../../components/BarRow'
import { BILL_STATE_TONE, PROJECT_STATUS_TONE } from '../../domain/status'
import { money, signedMoney } from '../../lib/format'
import { aggregate, applyFilters, clientName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'

export function Dashboard() {
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
  const agg = useMemo(() => aggregate(filtered, clients, owners), [filtered, clients, owners])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">
          {agg.count} projects · {year === 'all' ? 'all years' : year}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total PO" value={money(agg.totalPO)} />
        <Kpi label="Billed" value={money(agg.totalBilled)} />
        <Kpi label="Cost" value={money(agg.totalCost)} />
        <Kpi
          label="Gross Margin"
          value={signedMoney(agg.totalMargin)}
          tone={agg.totalMargin < 0 ? 'loss' : 'profit'}
          sub={agg.totalPO ? `${((agg.totalMargin / agg.totalPO) * 100).toFixed(1)}%` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Projects by status">
          <BarList data={agg.byProjectStatus.map((d) => ({ label: d.key, count: d.count, tone: PROJECT_STATUS_TONE[d.key] }))} />
        </Panel>
        <Panel title="Bills by state">
          <BarList data={agg.byBillState.map((d) => ({ label: d.key, count: d.count, tone: BILL_STATE_TONE[d.key] }))} />
        </Panel>
        <Panel title="Projects by client">
          <BarList accent data={agg.byClient.map((c) => ({ label: c.label, count: c.count }))} />
        </Panel>
        <Panel title="Projects by owner">
          <BarList accent data={agg.byOwner.map((o) => ({ label: o.label, count: o.count }))} />
        </Panel>
      </div>

      <Alerts alerts={agg.alerts} clients={clients} />
    </div>
  )
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'profit' | 'loss'
}) {
  return (
    <div className="card p-4">
      <div className="label">{label}</div>
      <div
        className={`font-mono text-xl font-semibold tabular ${
          tone === 'loss' ? 'text-rose-600 dark:text-rose-400' : tone === 'profit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-2xs text-faint">{sub}</div>}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-3 text-2xs font-semibold uppercase tracking-wider text-faint">{title}</div>
      {children}
    </div>
  )
}

function Alerts({
  alerts,
  clients,
}: {
  alerts: ReturnType<typeof aggregate>['alerts']
  clients: ReturnType<typeof useStore.getState>['clients']
}) {
  const openDetail = useUI((s) => s.openDetail)
  const META = {
    loss: { icon: TrendingDown, text: 'Loss-making', cls: 'text-rose-500' },
    po: { icon: FileWarning, text: 'Missing PO', cls: 'text-amber-500' },
    overdue: { icon: AlertTriangle, text: 'Payment overdue', cls: 'text-rose-500' },
  }
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-2xs font-semibold uppercase tracking-wider text-faint">Alerts</div>
        <span className="text-2xs text-faint">{alerts.length}</span>
      </div>
      {alerts.length === 0 ? (
        <p className="py-4 text-center text-sm text-faint">Nothing needs attention. 🎉</p>
      ) : (
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {alerts.slice(0, 12).map((a, i) => {
            const m = META[a.kind]
            const Icon = m.icon
            return (
              <li key={i}>
                <button
                  onClick={() => openDetail(a.project.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-left text-sm hover:bg-raised"
                >
                  <Icon size={14} className={`shrink-0 ${m.cls}`} />
                  <span className="font-mono text-2xs text-faint">{a.project.code}</span>
                  <span className="truncate text-ink">{a.project.name}</span>
                  <span className="ml-auto shrink-0 text-2xs text-faint">{clientName(clients, a.project.clientId)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
