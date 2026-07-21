import { Check, LinkIcon } from 'lucide-react'
import { docCompleteness } from '../../lib/format'
import type { Project } from '../../domain/types'
import { useStore } from '../../store/store'

export function DocumentsChecklist({ project, editable }: { project: Project; editable: boolean }) {
  const toggle = useStore((s) => s.toggleDocument)
  const setLink = useStore((s) => s.setDocumentLink)
  const { done, total } = docCompleteness(project.documents)
  const pct = Math.round((done / total) * 100)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-faint">
          Documents · {done}/{total}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="divide-y divide-line/60 overflow-hidden rounded-lg border border-line">
        {project.documents.map((d) => (
          <li key={d.type} className="flex items-center gap-2 bg-surface px-3 py-1.5">
            <button
              disabled={!editable}
              onClick={() => toggle(project.id, d.type)}
              className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                d.present
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-canvas text-transparent'
              } ${editable ? 'cursor-pointer' : 'cursor-default'}`}
              title={d.present ? 'Present' : 'Missing'}
            >
              <Check size={11} strokeWidth={3} />
            </button>
            <span className={`flex-1 text-sm ${d.present ? 'text-ink' : 'text-muted'}`}>{d.type}</span>
            {editable ? (
              <input
                value={d.link ?? ''}
                onChange={(e) => setLink(project.id, d.type, e.target.value)}
                placeholder="paste link…"
                className="w-40 rounded border border-line bg-canvas px-2 py-0.5 text-2xs text-muted focus:border-accent focus:outline-none"
              />
            ) : d.link ? (
              <a href={d.link} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                <LinkIcon size={13} />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
