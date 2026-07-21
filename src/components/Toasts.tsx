import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useStore } from '../store/store'

const ICON = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
}
const TONE = {
  ok: 'text-emerald-500',
  warn: 'text-amber-500',
  error: 'text-rose-500',
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} kind={t.kind} message={t.message} onDone={dismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  id,
  kind,
  message,
  onDone,
}: {
  id: number
  kind: 'ok' | 'warn' | 'error'
  message: string
  onDone: (id: number) => void
}) {
  const Icon = ICON[kind]
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 4200)
    return () => clearTimeout(t)
  }, [id, onDone])
  return (
    <div className="card animate-fade-up flex items-start gap-2.5 px-3.5 py-2.5 text-sm shadow-pop">
      <Icon size={16} className={`mt-0.5 shrink-0 ${TONE[kind]}`} />
      <span className="text-ink">{message}</span>
    </div>
  )
}
