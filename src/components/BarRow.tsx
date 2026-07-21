import { type Tone, TONE_CLASSES } from '../domain/status'

export interface BarDatum {
  label: string
  count: number
  tone?: Tone
}

// A compact horizontal bar list — no chart library, pure Tailwind.
export function BarList({ data, accent = false }: { data: BarDatum[]; accent?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[130px_1fr_28px] items-center gap-2">
          <span className="truncate text-2xs text-muted" title={d.label}>{d.label}</span>
          <div className="h-4 overflow-hidden rounded bg-raised">
            <div
              className={`h-full rounded transition-all ${
                accent
                  ? 'bg-accent'
                  : d.tone
                    ? TONE_CLASSES[d.tone].split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-accent'
                    : 'bg-accent'
              }`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-mono text-2xs tabular text-faint">{d.count}</span>
        </div>
      ))}
    </div>
  )
}
