import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Document, DocumentStatus } from '@/types'

interface DocumentState {
  documents: Record<string, Document>
  addDocuments: (docs: Document[]) => void
  updateDocument: (id: string, patch: Partial<Document>) => void
  getByCase: (caseId: string) => Document[]
  getById: (id: string) => Document | null
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: {},
      addDocuments: (docs) =>
        set((s) => {
          const next = { ...s.documents }
          for (const d of docs) next[d.id] = d
          return { documents: next }
        }),
      updateDocument: (id, patch) =>
        set((s) => ({
          documents: { ...s.documents, [id]: { ...s.documents[id], ...patch } },
        })),
      getByCase: (caseId) => Object.values(get().documents).filter((d) => d.caseId === caseId),
      getById: (id) => get().documents[id] ?? null,
    }),
    { name: 'arc_documents' }
  )
)
