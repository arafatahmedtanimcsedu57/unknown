import { margin, marginPct, signedMoney } from '../lib/format'

export function MarginBadge({
  poAmount,
  cost,
  showPct = true,
}: {
  poAmount: number
  cost: number
  showPct?: boolean
}) {
  const m = margin({ poAmount, cost })
  return (
    <span
      className={`inline-flex items-baseline gap-1 font-mono text-sm tabular ${
        m.loss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
      }`}
      title={`PO ${poAmount.toLocaleString()} − Cost ${cost.toLocaleString()}`}
    >
      {signedMoney(m.value)}
      {showPct && <span className="text-2xs opacity-70">{marginPct(m)}</span>}
    </span>
  )
}
