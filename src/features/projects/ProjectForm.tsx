import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { generateCode } from '../../domain/costcode'
import { margin, marginPct, money, signedMoney } from '../../lib/format'
import { type NewProjectInput, useStore } from '../../store/store'
import { useUI } from '../../store/ui'

const toDayValue = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const toISO = (day: string) => (day ? new Date(day + 'T00:00:00Z').toISOString() : null)

interface FormState {
  clientId: string
  ownerId: string
  name: string
  estimateDate: string
  poNumber: string
  poAmount: string
  billAmount: string
  executionFrom: string
  executionTo: string
  clientContact: string
  clientCell: string
  notes: string
}

export function ProjectForm() {
  const open = useUI((s) => s.editorOpen)
  const editingId = useUI((s) => s.editingId)
  const presetOwnerId = useUI((s) => s.presetOwnerId)
  const close = useUI((s) => s.closeEditor)

  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const projects = useStore((s) => s.projects)
  const addProject = useStore((s) => s.addProject)
  const updateProject = useStore((s) => s.updateProject)
  const toast = useStore((s) => s.toast)

  const editing = editingId ? projects.find((p) => p.id === editingId) ?? null : null

  const initial = useMemo<FormState>(() => {
    if (editing) {
      return {
        clientId: editing.clientId,
        ownerId: editing.ownerId,
        name: editing.name,
        estimateDate: toDayValue(editing.estimateDate),
        poNumber: editing.poNumber,
        poAmount: String(editing.poAmount),
        billAmount: String(editing.billAmount),
        executionFrom: toDayValue(editing.executionFrom),
        executionTo: toDayValue(editing.executionTo),
        clientContact: editing.clientContact,
        clientCell: editing.clientCell,
        notes: editing.notes,
      }
    }
    return {
      clientId: clients[0]?.id ?? '',
      ownerId: presetOwnerId ?? owners.find((o) => o.active)?.id ?? owners[0]?.id ?? '',
      name: '',
      estimateDate: new Date().toISOString().slice(0, 10),
      poNumber: '',
      poAmount: '',
      billAmount: '',
      executionFrom: '',
      executionTo: '',
      clientContact: '',
      clientCell: '',
      notes: '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, open])

  const [f, setF] = useState<FormState>(initial)
  // Re-seed the form whenever the modal opens or its target changes.
  useEffect(() => {
    if (open) setF(initial)
  }, [open, initial])

  const num = (v: string) => {
    const n = parseFloat(v)
    return Number.isNaN(n) ? 0 : n
  }
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!f.clientId) errors.clientId = 'Client is required'
  if (!f.name.trim()) errors.name = 'Project name is required'
  for (const k of ['poAmount', 'billAmount'] as const) {
    if (f[k] !== '' && Number.isNaN(parseFloat(f[k]))) errors[k] = 'Must be a number'
  }
  const hasErrors = Object.keys(errors).length > 0

  const poMissing = f.poNumber.trim() === '' || f.poNumber.trim().toUpperCase() === 'NA'
  const client = clients.find((c) => c.id === f.clientId)
  const codePreview = client ? generateCode(projects, client, toISO(f.estimateDate)) : '—'
  const currentCost = editing ? editing.cost : 0
  const m = margin({ poAmount: num(f.poAmount), cost: currentCost })

  const submit = () => {
    if (hasErrors) return
    const payload: NewProjectInput = {
      clientId: f.clientId,
      ownerId: f.ownerId,
      name: f.name.trim(),
      estimateDate: toISO(f.estimateDate),
      poNumber: f.poNumber.trim(),
      poAmount: num(f.poAmount),
      billAmount: num(f.billAmount),
      executionFrom: toISO(f.executionFrom),
      executionTo: toISO(f.executionTo),
      clientContact: f.clientContact.trim(),
      clientCell: f.clientCell.trim(),
      notes: f.notes.trim(),
    }
    if (editing) {
      updateProject(editing.id, payload)
      toast('ok', `Updated ${editing.code}.`)
    } else {
      const p = addProject(payload)
      toast('ok', `Created ${p.code}.`)
    }
    close()
  }

  const set = (patch: Partial<FormState>) => setF((prev) => ({ ...prev, ...patch }))

  return (
    <Modal open={open} onClose={close} wide title={editing ? `Edit ${editing.code}` : 'New Project'}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client" error={errors.clientId}>
          <select className="input" value={f.clientId} onChange={(e) => set({ clientId: e.target.value })}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.shortCode})</option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <select className="input" value={f.ownerId} onChange={(e) => set({ ownerId: e.target.value })}>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}{o.active ? '' : ' (inactive)'}</option>
            ))}
          </select>
        </Field>
        <Field label="Project Name" error={errors.name} full>
          <input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Annual Sales Conference" />
        </Field>

        <Field label="Estimate Date">
          <input type="date" className="input" value={f.estimateDate} onChange={(e) => set({ estimateDate: e.target.value })} />
        </Field>
        <Field label={`PO Number${poMissing ? '  ·  flagged missing' : ''}`}>
          <input className={`input ${poMissing ? 'border-amber-400' : ''}`} value={f.poNumber} onChange={(e) => set({ poNumber: e.target.value })} placeholder="NA if none yet" />
        </Field>

        <Field label="PO Amount" error={errors.poAmount}>
          <input className="input font-mono" value={f.poAmount} onChange={(e) => set({ poAmount: e.target.value })} inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="Bill Amount" error={errors.billAmount}>
          <input className="input font-mono" value={f.billAmount} onChange={(e) => set({ billAmount: e.target.value })} inputMode="decimal" placeholder="0" />
        </Field>
        <Field label="Cost (auto · from bills)">
          <div className="input flex items-center justify-between font-mono text-muted">
            <span>{money(currentCost)}</span>
            <span className="text-2xs text-faint">via bills</span>
          </div>
        </Field>
        <Field label="Margin (auto)">
          <div className={`input flex items-center justify-between font-mono ${m.loss ? 'text-rose-600' : 'text-emerald-600'}`}>
            <span>{signedMoney(m.value)}</span>
            <span className="text-2xs opacity-70">{marginPct(m)}</span>
          </div>
        </Field>

        <Field label="Execution From">
          <input type="date" className="input" value={f.executionFrom} onChange={(e) => set({ executionFrom: e.target.value })} />
        </Field>
        <Field label="Execution To">
          <input type="date" className="input" value={f.executionTo} onChange={(e) => set({ executionTo: e.target.value })} />
        </Field>

        <Field label="Client Contact">
          <input className="input" value={f.clientContact} onChange={(e) => set({ clientContact: e.target.value })} />
        </Field>
        <Field label="Client Cell">
          <input className="input font-mono" value={f.clientCell} onChange={(e) => set({ clientCell: e.target.value })} />
        </Field>

        <Field label="Notes" full>
          <textarea className="input min-h-[64px] resize-y" value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <div className="text-2xs text-faint">
          {editing ? 'Cost code' : 'Cost code (auto)'}:{' '}
          <span className="font-mono text-muted">{editing ? editing.code : codePreview}</span>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={close}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={hasErrors}>
            {editing ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string
  error?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-2xs text-rose-500">{error}</p>}
    </div>
  )
}
