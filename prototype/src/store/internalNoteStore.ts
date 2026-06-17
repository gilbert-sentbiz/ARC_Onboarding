import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InternalNote, UserRole } from '../types'

interface InternalNoteState {
  notes: Record<string, InternalNote[]>
  addNote: (caseId: string, author: { role: UserRole; name: string }, text: string) => void
  getNotes: (caseId: string) => InternalNote[]
}

export const useInternalNoteStore = create<InternalNoteState>()(
  persist(
    (set, get) => ({
      notes: {},
      addNote: (caseId, author, text) => {
        const note: InternalNote = {
          id: `note_${Date.now()}`,
          caseId,
          author,
          text,
          createdAt: Date.now(),
        }
        set((s) => ({
          notes: {
            ...s.notes,
            [caseId]: [...(s.notes[caseId] ?? []), note],
          },
        }))
      },
      getNotes: (caseId) => get().notes[caseId] ?? [],
    }),
    { name: 'internal_notes' }
  )
)
