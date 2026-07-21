import type { Client, DataSet, Owner, Project } from '../domain/types'
import { PROJECT_STATUSES } from '../domain/types'
import { approvedCost } from './format'

// ---- JSON export / import ----------------------------------------------
export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJSON(data: DataSet) {
  const stamp = new Date().toISOString().slice(0, 10)
  download(`project-tracker-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export function parseJSONFile(file: File): Promise<{ data?: DataSet; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result))
        const errors = validateDataSet(obj)
        resolve(errors.length ? { errors } : { data: obj as DataSet, errors: [] })
      } catch {
        resolve({ errors: ['File is not valid JSON.'] })
      }
    }
    reader.onerror = () => resolve({ errors: ['Could not read file.'] })
    reader.readAsText(file)
  })
}

export function validateDataSet(obj: unknown): string[] {
  const errors: string[] = []
  const o = obj as Partial<DataSet>
  if (!o || typeof o !== 'object') return ['Not a valid dataset object.']
  if (!Array.isArray(o.clients)) errors.push('Missing "clients" array.')
  if (!Array.isArray(o.owners)) errors.push('Missing "owners" array.')
  if (!Array.isArray(o.projects)) errors.push('Missing "projects" array.')
  if (Array.isArray(o.projects)) {
    for (const p of o.projects as Project[]) {
      if (p && p.projectStatus && !PROJECT_STATUSES.includes(p.projectStatus)) {
        errors.push(`Project ${p.code ?? '?'}: invalid project status "${p.projectStatus}".`)
        break
      }
    }
  }
  return errors
}

// Ensure referential integrity after any import.
export function normalizeDataSet(data: DataSet): DataSet {
  const clientIds = new Set(data.clients.map((c) => c.id))
  const ownerIds = new Set(data.owners.map((o) => o.id))
  const projects = data.projects.map((p) => {
    const bills = p.bills ?? []
    return {
      ...p,
      deleted: !!p.deleted,
      bills,
      cost: approvedCost(bills), // keep derived cost consistent with bills
      documents: p.documents ?? [],
      activity: p.activity ?? [],
      clientId: clientIds.has(p.clientId) ? p.clientId : (data.clients[0]?.id ?? p.clientId),
      ownerId: ownerIds.has(p.ownerId) ? p.ownerId : (data.owners[0]?.id ?? p.ownerId),
    }
  })
  return { clients: data.clients as Client[], owners: data.owners as Owner[], projects }
}
