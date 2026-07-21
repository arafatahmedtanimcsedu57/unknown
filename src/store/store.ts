import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateSample } from '../data/sample'
import { generateCode } from '../domain/costcode'
import {
  type Bill,
  type Client,
  type DataSet,
  type Owner,
  type Project,
  type ProjectStatus,
  type Role,
} from '../domain/types'
import { approvedCost, emptyDocuments } from '../lib/format'

const STORE_VERSION = 3

export interface Filters {
  status: ProjectStatus | 'all'
  clientId: string | 'all'
  ownerId: string | 'all'
  overdue: boolean
  pendingBills: boolean
}

export const emptyFilters = (): Filters => ({
  status: 'all',
  clientId: 'all',
  ownerId: 'all',
  overdue: false,
  pendingBills: false,
})

export type Theme = 'light' | 'dark'

export interface Toast {
  id: number
  kind: 'ok' | 'warn' | 'error'
  message: string
}

export interface NewProjectInput {
  clientId: string
  ownerId: string
  name: string
  estimateDate: string | null
  poNumber: string
  poAmount: number
  billAmount: number
  executionFrom: string | null
  executionTo: string | null
  clientContact: string
  clientCell: string
  notes: string
}

export interface NewBillInput {
  title: string
  amount: number
  links: string[]
}

interface StoreState {
  // data
  clients: Client[]
  owners: Owner[]
  projects: Project[]
  // session
  actingUserId: string
  role: Role
  year: number | 'all'
  filters: Filters
  search: string
  // ui
  theme: Theme
  toasts: Toast[]

  // ---- data actions ----
  addProject: (input: NewProjectInput) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  softDelete: (id: string) => void
  restore: (id: string) => void
  changeProjectStatus: (id: string, to: ProjectStatus) => void
  addBill: (projectId: string, input: NewBillInput) => void
  approveBill: (projectId: string, billId: string) => void
  rejectBill: (projectId: string, billId: string, note?: string) => void
  removeBill: (projectId: string, billId: string) => void
  toggleDocument: (projectId: string, type: string) => void
  setDocumentLink: (projectId: string, type: string, link: string) => void
  addClient: (c: Omit<Client, 'id'>) => void
  updateClient: (id: string, patch: Partial<Client>) => void
  addOwner: (name: string) => void
  updateOwner: (id: string, patch: Partial<Owner>) => void
  replaceData: (data: DataSet) => void
  resetToSample: () => void

  // ---- session actions ----
  setActingUser: (id: string) => void
  setRole: (r: Role) => void
  setYear: (y: number | 'all') => void
  setFilters: (f: Partial<Filters>) => void
  clearFilters: () => void
  setSearch: (s: string) => void

  // ---- ui actions ----
  setTheme: (t: Theme) => void
  toast: (kind: Toast['kind'], message: string) => void
  dismissToast: (id: number) => void
}

function activity(user: string, message: string) {
  return { at: new Date().toISOString(), user, message }
}

const initial = generateSample()

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      clients: initial.clients,
      owners: initial.owners,
      projects: initial.projects,
      actingUserId: initial.owners[0]?.id ?? '',
      role: 'Admin',
      year: 2026,
      filters: emptyFilters(),
      search: '',
      theme: 'light',
      toasts: [],

      addProject: (input) => {
        const { projects, clients } = get()
        const client = clients.find((c) => c.id === input.clientId)
        if (!client) throw new Error('Unknown client')
        const code = generateCode(projects, client, input.estimateDate)
        const s0 = get()
        const userName = s0.owners.find((o) => o.id === s0.actingUserId)?.name ?? 'Admin'
        const project: Project = {
          id: `p-${code}-${Date.now()}`,
          code,
          clientId: input.clientId,
          ownerId: input.ownerId,
          name: input.name,
          estimateDate: input.estimateDate,
          poNumber: input.poNumber,
          poAmount: input.poAmount,
          billAmount: input.billAmount,
          cost: 0, // derived from approved bills; none yet
          executionFrom: input.executionFrom,
          executionTo: input.executionTo,
          projectStatus: 'Ongoing',
          clientContact: input.clientContact,
          clientCell: input.clientCell,
          notes: input.notes,
          bills: [],
          documents: emptyDocuments(),
          activity: [activity(userName, `Project created with code ${code}`)],
          deleted: false,
          createdAt: new Date().toISOString(),
        }
        set({ projects: [project, ...projects] })
        return project
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      softDelete: (id) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, deleted: true } : p)),
        })),

      restore: (id) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, deleted: false } : p)),
        })),

      changeProjectStatus: (id, to) => {
        const s = get()
        const user = s.owners.find((o) => o.id === s.actingUserId)?.name ?? 'Admin'
        set({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, projectStatus: to, activity: [activity(user, `Project status → ${to}`), ...p.activity] }
              : p,
          ),
        })
      },

      addBill: (projectId, input) => {
        const s = get()
        const user = s.owners.find((o) => o.id === s.actingUserId)?.name ?? 'Admin'
        const bill: Bill = {
          id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: input.title,
          amount: input.amount,
          links: input.links.filter((l) => l.trim() !== ''),
          state: 'Pending',
          createdBy: user,
          createdAt: new Date().toISOString(),
        }
        set({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  bills: [bill, ...p.bills],
                  activity: [activity(user, `Bill raised: ${bill.title}`), ...p.activity],
                }
              : p,
          ),
        })
      },

      approveBill: (projectId, billId) => {
        const s = get()
        const user = s.owners.find((o) => o.id === s.actingUserId)?.name ?? 'Admin'
        set({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p
            const bills = p.bills.map((b) =>
              b.id === billId
                ? { ...b, state: 'Approved' as const, decidedBy: user, decidedAt: new Date().toISOString(), note: undefined }
                : b,
            )
            const done = bills.find((b) => b.id === billId)
            return {
              ...p,
              bills,
              cost: approvedCost(bills), // auto-increment
              activity: [activity(user, `Bill approved: ${done?.title ?? ''}`), ...p.activity],
            }
          }),
        })
      },

      rejectBill: (projectId, billId, note) => {
        const s = get()
        const user = s.owners.find((o) => o.id === s.actingUserId)?.name ?? 'Admin'
        set({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p
            const bills = p.bills.map((b) =>
              b.id === billId
                ? { ...b, state: 'Rejected' as const, decidedBy: user, decidedAt: new Date().toISOString(), note }
                : b,
            )
            const done = bills.find((b) => b.id === billId)
            return {
              ...p,
              bills,
              cost: approvedCost(bills),
              activity: [activity(user, `Bill sent back: ${done?.title ?? ''}`), ...p.activity],
            }
          }),
        })
      },

      removeBill: (projectId, billId) => {
        const s = get()
        const user = s.owners.find((o) => o.id === s.actingUserId)?.name ?? 'Admin'
        set({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p
            const bills = p.bills.filter((b) => b.id !== billId)
            return {
              ...p,
              bills,
              cost: approvedCost(bills),
              activity: [activity(user, 'Bill removed'), ...p.activity],
            }
          }),
        })
      },

      toggleDocument: (projectId, type) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  documents: p.documents.map((d) =>
                    d.type === type ? { ...d, present: !d.present } : d,
                  ),
                }
              : p,
          ),
        })),

      setDocumentLink: (projectId, type, link) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  documents: p.documents.map((d) =>
                    d.type === type ? { ...d, link, present: link ? true : d.present } : d,
                  ),
                }
              : p,
          ),
        })),

      addClient: (c) =>
        set((s) => ({
          clients: [...s.clients, { ...c, id: `c-${c.shortCode.toLowerCase()}-${Date.now()}` }],
        })),

      updateClient: (id, patch) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      addOwner: (name) =>
        set((s) => ({
          owners: [...s.owners, { id: `o-${Date.now()}`, name, active: true }],
        })),

      updateOwner: (id, patch) =>
        set((s) => ({ owners: s.owners.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),

      replaceData: (data) =>
        set({
          clients: data.clients,
          owners: data.owners,
          projects: data.projects,
          actingUserId: data.owners[0]?.id ?? '',
          filters: emptyFilters(),
          search: '',
        }),

      resetToSample: () => {
        const fresh = generateSample()
        get().replaceData(fresh)
      },

      setActingUser: (id) => set({ actingUserId: id }),
      setRole: (r) => set({ role: r }),
      setYear: (y) => set({ year: y }),
      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      clearFilters: () => set({ filters: emptyFilters(), search: '' }),
      setSearch: (search) => set({ search }),

      setTheme: (theme) => {
        const el = document.documentElement
        el.classList.remove('light', 'dark')
        el.classList.add(theme)
        try {
          localStorage.setItem('pt-theme', theme)
        } catch {
          /* ignore */
        }
        set({ theme })
      },

      toast: (kind, message) =>
        set((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), kind, message }] })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'pt-store',
      version: STORE_VERSION,
      partialize: (s) => ({
        clients: s.clients,
        owners: s.owners,
        projects: s.projects,
        actingUserId: s.actingUserId,
        role: s.role,
        year: s.year,
        theme: s.theme,
      }),
      migrate: () => {
        // Incompatible older data → fall back to a fresh sample.
        const fresh = generateSample()
        return {
          clients: fresh.clients,
          owners: fresh.owners,
          projects: fresh.projects,
          actingUserId: fresh.owners[0]?.id ?? '',
          role: 'Admin' as Role,
          year: 2026 as number | 'all',
          theme: 'light' as Theme,
        }
      },
    },
  ),
)
