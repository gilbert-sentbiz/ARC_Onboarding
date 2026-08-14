import { api } from '@/services/apiClient'
import type { DocumentResponse, RevisionResponse, RevisionRequest } from '@/types/api'

// C9: GET /cases/{caseId}/documents
export function listDocuments(caseId: string, token: string) {
  return api.get<DocumentResponse[]>(`/cases/${caseId}/documents`, { token })
}

// C10: POST /cases/{caseId}/documents/{docId}/file
export function uploadDocumentFile(caseId: string, docId: string, file: File, token: string) {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<DocumentResponse>(`/cases/${caseId}/documents/${docId}/file`, form, { token })
}

// I5: POST /internal/documents/{id}/revision-requests
export function requestRevision(docId: string, body: RevisionRequest, token: string) {
  return api.post<RevisionResponse>(`/internal/documents/${docId}/revision-requests`, body, { token })
}

// I6: POST /internal/documents/{id}/approve
export function approveDocument(docId: string, token: string) {
  return api.post<DocumentResponse>(`/internal/documents/${docId}/approve`, undefined, { token })
}
