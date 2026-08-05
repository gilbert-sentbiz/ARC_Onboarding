import type { DocumentFile, RevisionRequest, DocumentStatus } from '@/types'
import { useDocumentStore } from '@/store/documentStore'
import { useDocumentFileStore } from '@/store/documentFileStore'
import { useRevisionRequestStore } from '@/store/revisionRequestStore'
import { useCaseEventStore } from '@/store/caseEventStore'

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function getFiles(documentId: string): DocumentFile[] {
  return useDocumentFileStore.getState().getByDocument(documentId)
}

export function getLatestFile(documentId: string): DocumentFile | null {
  return useDocumentFileStore.getState().getLatest(documentId)
}

export function getActiveRevisions(documentId: string): RevisionRequest[] {
  return useRevisionRequestStore.getState().getActiveByDocument(documentId)
}

export function getRevisions(documentId: string): RevisionRequest[] {
  return useRevisionRequestStore.getState().getByDocument(documentId)
}

export function uploadFile(
  documentId: string,
  fileName: string,
  fileSize: number,
  uploadedBy: string,
  dataUrl?: string
): DocumentFile {
  const fileStore = useDocumentFileStore.getState()
  const docStore = useDocumentStore.getState()

  fileStore.markOldFilesNotLatest(documentId)

  const file: DocumentFile = {
    id: makeId('file'),
    documentId,
    fileName,
    fileSize,
    uploadedAt: Date.now(),
    uploadedBy,
    isLatest: true,
    dataUrl,
  }
  fileStore.addFile(file)

  const doc = docStore.getById(documentId)
  if (doc) {
    docStore.updateDocument(documentId, { status: 'SUBMITTED' as DocumentStatus })

    const caseId = doc.caseId
    useCaseEventStore.getState().append({
      id: makeId('evt'),
      caseId,
      eventType: 'DOC_STATUS_CHANGED',
      actorType: 'CUSTOMER',
      actorRole: 'CUSTOMER',
      actorName: uploadedBy,
      payload: { previousStatus: doc.status, newStatus: 'SUBMITTED', documentId },
      createdAt: Date.now(),
    })
  }

  return file
}

export function approveDocument(documentId: string, approvalNote: string, actorName: string): void {
  const docStore = useDocumentStore.getState()
  const doc = docStore.getById(documentId)
  if (!doc) return

  docStore.updateDocument(documentId, { status: 'APPROVED', approvalNote })

  useCaseEventStore.getState().append({
    id: makeId('evt'),
    caseId: doc.caseId,
    eventType: 'DOC_STATUS_CHANGED',
    actorType: 'STAFF',
    actorRole: 'COMPLIANCE',
    actorName,
    payload: { previousStatus: doc.status, newStatus: 'APPROVED', documentId },
    createdAt: Date.now(),
  })
}

export function requestRevision(
  documentId: string,
  reason: string,
  requestedBy: string
): void {
  const docStore = useDocumentStore.getState()
  const doc = docStore.getById(documentId)
  if (!doc) return

  docStore.updateDocument(documentId, { status: 'REVISION_REQUIRED' })

  const now = Date.now()
  useRevisionRequestStore.getState().add({
    id: makeId('rev'),
    documentId,
    reason,
    requestedBy,
    requestedAt: now,
  })

  useCaseEventStore.getState().append({
    id: makeId('evt'),
    caseId: doc.caseId,
    eventType: 'DOC_STATUS_CHANGED',
    actorType: 'STAFF',
    actorRole: 'COMPLIANCE',
    actorName: requestedBy,
    payload: { previousStatus: doc.status, newStatus: 'REVISION_REQUIRED', documentId },
    createdAt: now,
  })
}
