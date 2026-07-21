import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/store'

export function Admin() {
  const role = useStore((s) => s.role)
  if (role !== 'Admin') {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        Admin tools require the <span className="font-semibold text-ink">Admin</span> role. Switch role in the top bar.
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Admin · Reference Data</h1>
        <p className="text-sm text-muted">Clients drive cost-code numbering; owners back the “acting as” roster.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Clients />
        <Owners />
      </div>
    </div>
  )
}

function Clients() {
  const clients = useStore((s) => s.clients)
  const projects = useStore((s) => s.projects)
  const addClient = useStore((s) => s.addClient)
  const updateClient = useStore((s) => s.updateClient)
  const toast = useStore((s) => s.toast)
  const [name, setName] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [comNum, setComNum] = useState('')

  const countFor = (id: string) => projects.filter((p) => p.clientId === id && !p.deleted).length

  const add = () => {
    if (!name.trim() || !shortCode.trim() || !comNum.trim()) {
      toast('error', 'Name, short code and company number are required.')
      return
    }
    if (clients.some((c) => c.comNum.padStart(2, '0') === comNum.padStart(2, '0'))) {
      toast('error', `Company number ${comNum} is already in use.`)
      return
    }
    addClient({ name: name.trim(), shortCode: shortCode.trim(), comNum: comNum.padStart(2, '0') })
    toast('ok', `Added ${name}.`)
    setName(''); setShortCode(''); setComNum('')
  }

  return (
    <div className="card p-4">
      <div className="mb-3 text-2xs font-semibold uppercase tracking-wider text-faint">Clients ({clients.length})</div>
      <div className="space-y-1.5">
        {clients.map((c) => (
          <div key={c.id} className="grid grid-cols-[1fr_70px_48px_46px] items-center gap-2">
            <input className="input py-1 text-sm" value={c.name} onChange={(e) => updateClient(c.id, { name: e.target.value })} />
            <input className="input py-1 text-center font-mono text-xs" value={c.shortCode} onChange={(e) => updateClient(c.id, { shortCode: e.target.value })} />
            <input className="input py-1 text-center font-mono text-xs" value={c.comNum} onChange={(e) => updateClient(c.id, { comNum: e.target.value })} />
            <span className="text-right text-2xs text-faint">{countFor(c.id)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_70px_48px_46px] items-center gap-2 border-t border-line pt-3">
        <input className="input py-1 text-sm" placeholder="New client name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input py-1 text-center font-mono text-xs" placeholder="ABC" value={shortCode} onChange={(e) => setShortCode(e.target.value)} />
        <input className="input py-1 text-center font-mono text-xs" placeholder="07" value={comNum} onChange={(e) => setComNum(e.target.value)} />
        <button className="btn-primary justify-center px-2 py-1" onClick={add}><Plus size={14} /></button>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_70px_48px_46px] gap-2 px-1 text-2xs text-faint">
        <span>Name</span><span className="text-center">Code</span><span className="text-center">Com#</span><span className="text-right">Proj</span>
      </div>
    </div>
  )
}

function Owners() {
  const owners = useStore((s) => s.owners)
  const addOwner = useStore((s) => s.addOwner)
  const updateOwner = useStore((s) => s.updateOwner)
  const toast = useStore((s) => s.toast)
  const [name, setName] = useState('')

  const add = () => {
    if (!name.trim()) return
    addOwner(name.trim())
    toast('ok', `Added ${name}.`)
    setName('')
  }

  return (
    <div className="card p-4">
      <div className="mb-3 text-2xs font-semibold uppercase tracking-wider text-faint">Owners ({owners.length})</div>
      <div className="space-y-1">
        {owners.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-raised">
            <input
              className="flex-1 border-none bg-transparent text-sm text-ink focus:outline-none"
              value={o.name}
              onChange={(e) => updateOwner(o.id, { name: e.target.value })}
            />
            <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-muted">
              <input type="checkbox" checked={o.active} onChange={(e) => updateOwner(o.id, { active: e.target.checked })} className="accent-accent" />
              active
            </label>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        <input className="input py-1 text-sm" placeholder="New owner name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn-primary px-2 py-1" onClick={add}><Plus size={14} /></button>
      </div>
    </div>
  )
}
