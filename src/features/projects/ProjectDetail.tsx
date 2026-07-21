import { Pencil, Phone, Trash2, User } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { ProjectStatusPill } from '../../components/StatusPill'
import { MarginBadge } from '../../components/MarginBadge'
import { nextProjectStatuses } from '../../domain/status'
import type { ProjectStatus } from '../../domain/types'
import { fmtDate, fmtDateTime, money } from '../../lib/format'
import { ownerName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'
import { BillsSection } from '../bills/BillsSection'
import { DocumentsChecklist } from '../documents/DocumentsChecklist'

export function ProjectDetail() {
  const detailId = useUI((s) => s.detailId)
  const close = useUI((s) => s.closeDetail)
  const openEdit = useUI((s) => s.openEdit)

  const project = useStore((s) => s.projects.find((p) => p.id === detailId) ?? null)
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const role = useStore((s) => s.role)
  const changeProjectStatus = useStore((s) => s.changeProjectStatus)
  const softDelete = useStore((s) => s.softDelete)
  const restore = useStore((s) => s.restore)
  const toast = useStore((s) => s.toast)

  if (!project) return null

  const isAdmin = role === 'Admin'
  const canEdit = role === 'Admin' || role === 'Owner'
  const canProjectStatus = role === 'Admin' || role === 'Owner'

  return (
    <Modal
      open={!!detailId}
      onClose={close}
      wide
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">{project.code}</span>
          <span>{project.name}</span>
          {project.deleted && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-2xs font-semibold text-rose-600">deleted</span>
          )}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">{clients.find((c) => c.id === project.clientId)?.name}</span>
            <span className="flex items-center gap-1 text-muted"><User size={13} /> {ownerName(owners, project.ownerId)}</span>
            <span className="text-faint">Estimate {fmtDate(project.estimateDate)}</span>
          </div>

          {/* Project status */}
          <div className="rounded-lg border border-line p-3">
            <div className="label">Project Status</div>
            <ProjectStatusPill status={project.projectStatus} />
            {canProjectStatus && (
              <Advancer
                options={nextProjectStatuses(project.projectStatus, isAdmin)}
                onPick={(to) => {
                  changeProjectStatus(project.id, to as ProjectStatus)
                  toast('ok', `Status → ${to}`)
                }}
              />
            )}
          </div>

          {/* Money */}
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-line bg-raised/40 p-3 text-center">
            <Money label="PO" value={money(project.poAmount)} />
            <Money label="Billed" value={money(project.billAmount)} />
            <Money label="Cost (bills)" value={money(project.cost)} />
            <div>
              <div className="label mb-0.5">Margin</div>
              <MarginBadge poAmount={project.poAmount} cost={project.cost} />
            </div>
          </div>

          {/* Bills */}
          <BillsSection project={project} />

          {/* Meta */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Meta label="PO Number" value={project.poNumber || 'NA'} mono />
            <Meta label="Execution" value={`${fmtDate(project.executionFrom)} → ${fmtDate(project.executionTo)}`} />
            <Meta label="Client Contact" value={project.clientContact || '—'} />
            <Meta label="Cell" value={project.clientCell || '—'} mono icon={<Phone size={12} />} />
          </dl>
          {project.notes && (
            <div>
              <div className="label">Notes</div>
              <p className="text-sm text-muted">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <DocumentsChecklist project={project} editable={canEdit} />

          <div>
            <div className="label">Activity</div>
            <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {project.activity.map((a, i) => (
                <li key={i} className="flex gap-2 text-2xs">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                  <div>
                    <span className="text-ink">{a.message}</span>
                    <div className="text-faint">{a.user} · {fmtDateTime(a.at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <div className="text-2xs text-faint">Created {fmtDate(project.createdAt)}</div>
        {canEdit && (
          <div className="flex gap-2">
            {project.deleted ? (
              <button className="btn-outline" onClick={() => { restore(project.id); toast('ok', 'Restored.') }}>Restore</button>
            ) : (
              <button
                className="btn-ghost text-rose-600 dark:text-rose-400"
                onClick={() => { softDelete(project.id); toast('warn', `${project.code} deleted (soft).`) }}
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            <button className="btn-primary" onClick={() => openEdit(project.id)}>
              <Pencil size={15} /> Edit
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Advancer({ options, onPick }: { options: string[]; onPick: (v: string) => void }) {
  if (!options.length) return null
  return (
    <select
      className="input mt-2 w-full py-1 text-2xs"
      value=""
      onChange={(e) => e.target.value && onPick(e.target.value)}
    >
      <option value="">Change to…</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function Money({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label mb-0.5">{label}</div>
      <div className="font-mono text-sm tabular">{value}</div>
    </div>
  )
}

function Meta({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className={`flex items-center gap-1 text-ink ${mono ? 'font-mono text-xs' : 'text-sm'}`}>
        {icon}
        {value}
      </dd>
    </div>
  )
}
