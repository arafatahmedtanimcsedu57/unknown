import { Check, LinkIcon, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { BillStatePill } from '../../components/StatusPill'
import type { Bill, Project } from '../../domain/types'
import { approvedCost, fmtDateTime, money, pendingCost } from '../../lib/format'
import { useStore } from '../../store/store'

export function BillsSection({ project }: { project: Project }) {
  const role = useStore((s) => s.role)
  const addBill = useStore((s) => s.addBill)
  const approveBill = useStore((s) => s.approveBill)
  const rejectBill = useStore((s) => s.rejectBill)
  const removeBill = useStore((s) => s.removeBill)
  const toast = useStore((s) => s.toast)

  const canCreate = role === 'Admin' || role === 'Owner'
  const canApprove = role === 'Admin' || role === 'Finance'
  const [adding, setAdding] = useState(false)

  const approved = approvedCost(project.bills)
  const pending = pendingCost(project.bills)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-faint">
          Bills · {project.bills.length}
        </span>
        {canCreate && !adding && (
          <button className="btn-ghost px-2 py-0.5 text-2xs" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add bill
          </button>
        )}
      </div>

      {/* Cost summary */}
      <div className="mb-2 flex items-center gap-3 rounded-lg border border-line bg-raised/40 px-3 py-2 text-2xs">
        <span className="text-muted">
          Approved <span className="font-mono text-emerald-600 dark:text-emerald-400">{money(approved)}</span>
        </span>
        {pending > 0 && (
          <span className="text-muted">
            Pending <span className="font-mono text-amber-600 dark:text-amber-400">{money(pending)}</span>
          </span>
        )}
        <span className="ml-auto text-faint">= project cost</span>
      </div>

      {adding && (
        <AddBillForm
          onCancel={() => setAdding(false)}
          onAdd={(input) => {
            addBill(project.id, input)
            toast('ok', `Bill raised: ${input.title}`)
            setAdding(false)
          }}
        />
      )}

      {project.bills.length === 0 && !adding ? (
        <p className="py-3 text-center text-2xs text-faint">No bills yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {project.bills.map((b) => (
            <BillRow
              key={b.id}
              bill={b}
              canApprove={canApprove}
              canRemove={canCreate && b.state === 'Pending'}
              onApprove={() => {
                approveBill(project.id, b.id)
                toast('ok', `Approved ${b.title} (+${money(b.amount)} cost)`)
              }}
              onReject={() => {
                rejectBill(project.id, b.id)
                toast('warn', `Sent back: ${b.title}`)
              }}
              onRemove={() => {
                removeBill(project.id, b.id)
                toast('warn', 'Bill removed')
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function BillRow({
  bill,
  canApprove,
  canRemove,
  onApprove,
  onReject,
  onRemove,
}: {
  bill: Bill
  canApprove: boolean
  canRemove: boolean
  onApprove: () => void
  onReject: () => void
  onRemove: () => void
}) {
  return (
    <li className="rounded-lg border border-line bg-surface px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-sm text-ink">{bill.title}</span>
        <span className="font-mono text-xs tabular text-muted">{money(bill.amount)}</span>
        <BillStatePill state={bill.state} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {bill.links.map((l, i) => (
            <a key={i} href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-2xs text-accent hover:underline">
              <LinkIcon size={11} /> doc{bill.links.length > 1 ? ` ${i + 1}` : ''}
            </a>
          ))}
          <span className="text-2xs text-faint">
            {bill.createdBy} · {fmtDateTime(bill.createdAt)}
            {bill.decidedBy && ` → ${bill.state.toLowerCase()} by ${bill.decidedBy}`}
          </span>
        </div>
        {bill.state === 'Pending' && (
          <div className="flex shrink-0 gap-1">
            {canApprove && (
              <>
                <button className="btn-primary px-2 py-0.5 text-2xs" onClick={onApprove} title="Approve">
                  <Check size={12} /> Approve
                </button>
                <button className="btn-outline px-2 py-0.5 text-2xs" onClick={onReject} title="Send back">
                  <RotateCcw size={12} />
                </button>
              </>
            )}
            {canRemove && !canApprove && (
              <button className="btn-ghost px-2 py-0.5 text-2xs text-rose-500" onClick={onRemove} title="Remove">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

function AddBillForm({
  onAdd,
  onCancel,
}: {
  onAdd: (input: { title: string; amount: number; links: string[] }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [linksText, setLinksText] = useState('')

  const amt = parseFloat(amount)
  const links = linksText.split('\n').map((l) => l.trim()).filter(Boolean)
  const valid = title.trim() !== '' && !Number.isNaN(amt) && amt > 0 && links.length > 0

  return (
    <div className="mb-2 space-y-2 rounded-lg border border-accent/40 bg-accent-soft/30 p-2.5">
      <div className="flex gap-2">
        <input className="input py-1 text-sm" placeholder="Bill title (e.g. Venue rental)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input w-32 py-1 text-sm font-mono" placeholder="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <textarea
        className="input min-h-[52px] resize-y py-1 text-2xs"
        placeholder="Document link(s) — one URL per line (at least one required)"
        value={linksText}
        onChange={(e) => setLinksText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <span className="text-2xs text-faint">{links.length} link{links.length === 1 ? '' : 's'}</span>
        <div className="flex gap-2">
          <button className="btn-ghost px-2 py-1 text-2xs" onClick={onCancel}>
            <X size={12} /> Cancel
          </button>
          <button className="btn-primary px-2 py-1 text-2xs" disabled={!valid} onClick={() => onAdd({ title: title.trim(), amount: amt, links })}>
            <Plus size={12} /> Raise bill
          </button>
        </div>
      </div>
    </div>
  )
}
