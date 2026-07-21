import {
  ChevronDown,
  Database,
  Download,
  Moon,
  RotateCcw,
  Search,
  Sun,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { ROLES } from '../domain/types'
import { exportJSON, parseJSONFile } from '../lib/io'
import { exportWorkbook, importWorkbook } from '../lib/xlsx'
import { useYears } from '../store/selectors'
import { useStore } from '../store/store'

export function TopBar() {
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)
  const year = useStore((s) => s.year)
  const setYear = useStore((s) => s.setYear)
  const years = useYears()

  const owners = useStore((s) => s.owners)
  const actingUserId = useStore((s) => s.actingUserId)
  const setActingUser = useStore((s) => s.setActingUser)
  const role = useStore((s) => s.role)
  const setRole = useStore((s) => s.setRole)

  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-line bg-surface/85 px-4 py-2.5 backdrop-blur sm:px-6">
      {/* Search */}
      <div className="relative min-w-[180px] flex-1">
        <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, project, client…"
          className="input pl-8"
        />
      </div>

      {/* Year */}
      <select
        value={String(year)}
        onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        className="input w-auto"
        title="Year"
      >
        <option value="all">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Acting as */}
      <div className="flex items-center rounded-lg border border-line bg-canvas text-sm">
        <span className="px-2 text-2xs font-semibold uppercase tracking-wider text-faint">as</span>
        <select
          value={actingUserId}
          onChange={(e) => setActingUser(e.target.value)}
          className="border-l border-line bg-transparent py-1.5 pl-2 pr-1 text-ink focus:outline-none"
          title="Acting as user"
        >
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.active ? '' : ' (inactive)'}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="rounded-r-lg border-l border-line bg-transparent py-1.5 pl-2 pr-1 font-medium text-accent focus:outline-none"
          title="Acting role"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <DataMenu />

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="btn-outline px-2"
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}

function DataMenu() {
  const [open, setOpen] = useState(false)
  const jsonInput = useRef<HTMLInputElement>(null)
  const xlsxInput = useRef<HTMLInputElement>(null)

  const clients = useStore((s) => s.clients)
  const owners = useStore((s) => s.owners)
  const projects = useStore((s) => s.projects)
  const dataset = { clients, owners, projects }
  const replaceData = useStore((s) => s.replaceData)
  const resetToSample = useStore((s) => s.resetToSample)
  const toast = useStore((s) => s.toast)

  const handleJSON = async (file: File) => {
    const { data, errors } = await parseJSONFile(file)
    if (data) {
      replaceData(data)
      toast('ok', `Imported ${data.projects.length} projects from JSON.`)
    } else {
      toast('error', errors[0] ?? 'Import failed.')
    }
  }

  const handleXLSX = async (file: File) => {
    const { data, errors, warnings } = await importWorkbook(file)
    if (data) {
      replaceData(data)
      toast('ok', `Imported ${data.projects.length} projects from xlsx.`)
      if (warnings.length) toast('warn', `${warnings.length} row warning(s) — see console.`)
      if (warnings.length) console.warn('Import warnings:', warnings)
    } else {
      toast('error', errors[0] ?? 'Import failed.')
    }
  }

  const item =
    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-raised'

  return (
    <div className="relative">
      <button className="btn-outline" onClick={() => setOpen((v) => !v)} onBlur={() => setTimeout(() => setOpen(false), 150)}>
        <Database size={15} /> Data <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop">
          <div className="px-3 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-faint">Export</div>
          <button className={item} onMouseDown={(e) => e.preventDefault()} onClick={() => exportJSON(dataset)}>
            <Download size={15} /> Export JSON
          </button>
          <button className={item} onMouseDown={(e) => e.preventDefault()} onClick={() => exportWorkbook(dataset)}>
            <Download size={15} /> Export xlsx
          </button>
          <div className="my-1 border-t border-line" />
          <div className="px-3 pb-1 pt-0.5 text-2xs font-semibold uppercase tracking-wider text-faint">Import</div>
          <button className={item} onMouseDown={(e) => e.preventDefault()} onClick={() => jsonInput.current?.click()}>
            <Upload size={15} /> Import JSON
          </button>
          <button className={item} onMouseDown={(e) => e.preventDefault()} onClick={() => xlsxInput.current?.click()}>
            <Upload size={15} /> Import xlsx
          </button>
          <div className="my-1 border-t border-line" />
          <button
            className={`${item} text-rose-600 dark:text-rose-400`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (confirm('Reset to the bundled sample? Your current changes will be lost.')) {
                resetToSample()
                toast('ok', 'Reset to bundled sample.')
              }
            }}
          >
            <RotateCcw size={15} /> Reset to sample
          </button>
        </div>
      )}
      <input
        ref={jsonInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleJSON(e.target.files[0]).then(() => (e.target.value = ''))}
      />
      <input
        ref={xlsxInput}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleXLSX(e.target.files[0]).then(() => (e.target.value = ''))}
      />
    </div>
  )
}
