import { create } from 'zustand'

interface UIState {
  detailId: string | null
  editorOpen: boolean
  editingId: string | null // null = creating
  presetOwnerId: string | null

  openDetail: (id: string) => void
  closeDetail: () => void
  openCreate: (presetOwnerId?: string) => void
  openEdit: (id: string) => void
  closeEditor: () => void
}

export const useUI = create<UIState>((set) => ({
  detailId: null,
  editorOpen: false,
  editingId: null,
  presetOwnerId: null,

  openDetail: (id) => set({ detailId: id }),
  closeDetail: () => set({ detailId: null }),
  openCreate: (presetOwnerId) => set({ editorOpen: true, editingId: null, presetOwnerId: presetOwnerId ?? null }),
  openEdit: (id) => set({ editorOpen: true, editingId: id, presetOwnerId: null }),
  closeEditor: () => set({ editorOpen: false, editingId: null, presetOwnerId: null }),
}))
