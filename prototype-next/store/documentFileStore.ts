import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocumentFile } from '@/types'

interface DocumentFileState {
  files: Record<string, DocumentFile>
  addFile: (f: DocumentFile) => void
  markOldFilesNotLatest: (documentId: string) => void
  getByDocument: (documentId: string) => DocumentFile[]
  getLatest: (documentId: string) => DocumentFile | null
}

export const useDocumentFileStore = create<DocumentFileState>()(
  persist(
    (set, get) => ({
      files: {},
      addFile: (f) => set((s) => ({ files: { ...s.files, [f.id]: f } })),
      markOldFilesNotLatest: (documentId) =>
        set((s) => {
          const next = { ...s.files }
          for (const id of Object.keys(next)) {
            if (next[id].documentId === documentId) {
              next[id] = { ...next[id], isLatest: false }
            }
          }
          return { files: next }
        }),
      getByDocument: (documentId) =>
        Object.values(get().files).filter((f) => f.documentId === documentId),
      getLatest: (documentId) =>
        Object.values(get().files).find((f) => f.documentId === documentId && f.isLatest) ?? null,
    }),
    { name: 'arc_document_files' }
  )
)
