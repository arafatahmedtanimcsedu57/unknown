import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useMemo } from 'react'
import { MarginBadge } from '../../components/MarginBadge'
import { isValidProjectTransition, PROJECT_STATUS_TONE, TONE_CLASSES } from '../../domain/status'
import { PROJECT_STATUSES, type Project, type ProjectStatus } from '../../domain/types'
import { applyFilters, clientName } from '../../store/selectors'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'
import { FilterBar } from '../projects/FilterBar'

export function Board() {
  const projects = useStore((s) => s.projects)
  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const filters = useStore((s) => s.filters)
  const year = useStore((s) => s.year)
  const search = useStore((s) => s.search)
  const role = useStore((s) => s.role)
  const changeProjectStatus = useStore((s) => s.changeProjectStatus)
  const toast = useStore((s) => s.toast)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const isAdmin = role === 'Admin'
  const canMove = role === 'Admin' || role === 'Owner'

  const filtered = useMemo(
    () => applyFilters(projects, { year, filters, search, clients, owners }),
    [projects, year, filters, search, clients, owners],
  )

  const byStatus = useMemo(() => {
    const map = new Map<ProjectStatus, Project[]>()
    for (const s of PROJECT_STATUSES) map.set(s, [])
    for (const p of filtered) map.get(p.projectStatus)?.push(p)
    return map
  }, [filtered])

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id)
    const to = e.over?.id as ProjectStatus | undefined
    if (!to) return
    const p = projects.find((x) => x.id === id)
    if (!p || p.projectStatus === to) return
    if (!isValidProjectTransition(p.projectStatus, to, isAdmin)) {
      toast('warn', `Can't move ${p.code} to “${to}” — not an adjacent step.`)
      return
    }
    changeProjectStatus(id, to)
    toast('ok', `${p.code} → ${to}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="text-sm text-muted">
            {canMove ? 'Drag cards to advance a project through the pipeline.' : 'Read-only board (your role can’t move cards).'}
          </p>
        </div>
      </div>
      <FilterBar />

      <DndContext sensors={sensors} onDragEnd={canMove ? onDragEnd : undefined}>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {PROJECT_STATUSES.map((status) => (
            <Column key={status} status={status} projects={byStatus.get(status) ?? []} clients={clients} draggable={canMove} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

function Column({
  status,
  projects,
  clients,
  draggable,
}: {
  status: ProjectStatus
  projects: Project[]
  clients: ReturnType<typeof useStore.getState>['clients']
  draggable: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset ${TONE_CLASSES[PROJECT_STATUS_TONE[status]]}`}>
          {status}
        </span>
        <span className="text-2xs text-faint">{projects.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[120px] flex-1 space-y-2 rounded-xl border border-dashed p-2 transition-colors ${
          isOver ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface/40'
        }`}
      >
        {projects.map((p) => (
          <Card key={p.id} project={p} clients={clients} draggable={draggable} />
        ))}
      </div>
    </div>
  )
}

function Card({
  project,
  clients,
  draggable,
}: {
  project: Project
  clients: ReturnType<typeof useStore.getState>['clients']
  draggable: boolean
}) {
  const openDetail = useUI((s) => s.openDetail)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    disabled: !draggable,
  })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => openDetail(project.id)}
      className={`card cursor-pointer p-2.5 text-left shadow-none hover:border-accent/50 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-2xs text-faint">{project.code}</span>
        <span className="text-2xs font-semibold text-muted">{clientName(clients, project.clientId)}</span>
      </div>
      <div className="mb-1.5 line-clamp-2 text-xs font-medium text-ink">{project.name}</div>
      <MarginBadge poAmount={project.poAmount} cost={project.cost} showPct={false} />
    </div>
  )
}
