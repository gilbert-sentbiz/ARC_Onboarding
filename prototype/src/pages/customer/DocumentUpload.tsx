import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, CloudArrowUp, Warning, ArrowRight, Clock, Link } from '@phosphor-icons/react'
import { useCaseStore } from '../../store/caseStore'
import { useDocumentStore } from '../../store/documentStore'
import { useDocumentFileStore } from '../../store/documentFileStore'
import { useRevisionRequestStore } from '../../store/revisionRequestStore'
import { useSessionStore } from '../../store/sessionStore'
import { transitionStatus, resubmitRevision } from '../../services/caseService'
import { uploadFile as uploadDocFile } from '../../services/documentService'
import type { Document, DocumentFile, RevisionRequest } from '../../types'
import Button from '../../components/ui/Button'
import TabBar from '../../components/customer/TabBar'

function UrlRow({
  doc,
  latestFile,
  onSave,
}: {
  doc: Document
  latestFile: DocumentFile | null
  onSave: (docId: string, url: string) => void
}) {
  const isSubmitted = doc.status === 'SUBMITTED' || doc.status === 'APPROVED'
  const needsRevision = doc.status === 'REVISION_REQUIRED'
  const savedUrl = latestFile?.fileName ?? ''
  const [url, setUrl] = useState(savedUrl)

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-[10px] border transition-colors ${
        needsRevision ? 'border-amber-300 bg-amber-50' : isSubmitted ? 'border-sb-positive bg-green-50' : 'border-sb-n200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {isSubmitted ? (
            <CheckCircle size={18} weight="fill" className="text-sb-positive" />
          ) : needsRevision ? (
            <Warning size={18} weight="fill" className="text-amber-500" />
          ) : (
            <Link size={18} className="text-sb-n400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-sb-n800 leading-[20px]">{doc.displayName}</p>
          {doc.isConditional && !doc.isRequired && (
            <p className="text-[11px] text-sb-n400 mt-0.5">조건부 제출</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 text-[13px] border border-sb-n200 rounded-[6px] px-3 py-1.5 outline-none focus:border-sb-brand"
        />
        <button
          type="button"
          onClick={() => { if (url.trim()) onSave(doc.id, url.trim()) }}
          disabled={!url.trim()}
          className="flex-shrink-0 px-3 py-1.5 rounded-[6px] border text-[13px] font-medium transition-colors border-sb-brand text-sb-brand hover:bg-sb-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          확인
        </button>
      </div>
    </div>
  )
}

function DocRow({
  doc,
  latestFile,
  latestRevision,
  onUpload,
}: {
  doc: Document
  latestFile: DocumentFile | null
  latestRevision: RevisionRequest | null
  onUpload: (docId: string, file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploaded = doc.status === 'SUBMITTED' || doc.status === 'APPROVED'
  const needsRevision = doc.status === 'REVISION_REQUIRED'
  const isAdHocPending = doc.isAdHoc && doc.status === 'REQUESTED'

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-[10px] border transition-colors ${
        needsRevision || isAdHocPending
          ? 'border-amber-300 bg-amber-50'
          : isUploaded
          ? 'border-sb-positive bg-green-50'
          : 'border-sb-n200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {isUploaded ? (
            <CheckCircle size={18} weight="fill" className="text-sb-positive" />
          ) : needsRevision || isAdHocPending ? (
            <Warning size={18} weight="fill" className="text-amber-500" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-sb-n300" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-sb-n800 leading-[20px]">{doc.displayName}</p>
            {isAdHocPending && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">제출 필요</span>
            )}
          </div>
          {doc.isConditional && !doc.isRequired && (
            <p className="text-[11px] text-sb-n400 mt-0.5">조건부 제출</p>
          )}
          {isUploaded && latestFile && (
            <p className="text-[11px] mt-0.5 truncate text-sb-positive">{latestFile.fileName} 업로드됨</p>
          )}
          {(needsRevision || isAdHocPending) && latestRevision && (
            <p className="text-[11px] text-amber-600 mt-0.5">{latestRevision.reason}</p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(doc.id, file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-[13px] font-medium transition-colors ${
            isUploaded
              ? 'border-sb-n200 text-sb-n500 hover:border-sb-n400'
              : 'border-sb-brand text-sb-brand hover:bg-sb-blue-100'
          }`}
        >
          <CloudArrowUp size={14} />
          {isUploaded ? '재업로드' : '업로드'}
        </button>
      </div>
    </div>
  )
}

export default function DocumentUpload() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const documents = useDocumentStore((s) => s.getByCase(id ?? ''))
  const allFiles = useDocumentFileStore((s) => s.files)
  const allRevisions = useRevisionRequestStore((s) => s.requests)
  const [submitted, setSubmitted] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg']
  const ALLOWED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']
  const MAX_BYTES = 10 * 1024 * 1024

  if (!c || !id) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-sb-n50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[480px] bg-white rounded-[20px] p-10 flex flex-col items-center gap-4 text-center" style={{ boxShadow: 'var(--shadow-200)' }}>
          <CheckCircle size={52} weight="fill" className="text-sb-positive" />
          <div>
            <p className="text-[18px] font-bold text-sb-n900 mb-2">서류가 제출되었습니다</p>
            <p className="text-[14px] text-sb-n600 leading-relaxed">
              담당팀에서 검토 후 연락드리겠습니다.<br />잠시 후 상태 & 이력으로 이동합니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getLatestFile = (docId: string): DocumentFile | null =>
    Object.values(allFiles).find((f) => f.documentId === docId && f.isLatest) ?? null

  const getLatestRevision = (docId: string): RevisionRequest | null =>
    Object.values(allRevisions)
      .filter((r) => r.documentId === docId && !r.resolvedAt)
      .sort((a, b) => b.requestedAt - a.requestedAt)[0] ?? null

  const isRevision = c.status === 'REVISION_REQUESTED'
  const requiredDocs = documents.filter((d) => d.isRequired)
  const allRequiredUploaded = requiredDocs.every(
    (d) => d.status === 'SUBMITTED' || d.status === 'APPROVED'
  )
  const noRevisionRemaining = !documents.some((d) => d.status === 'REVISION_REQUIRED')
  const noAdHocPending = !documents.some((d) => d.isAdHoc && d.status === 'REQUESTED')
  const canSubmit = isRevision ? (noRevisionRemaining && noAdHocPending) : allRequiredUploaded

  const displayDocs = isRevision
    ? documents
    : [...documents.filter((d) => d.isRequired), ...documents.filter((d) => !d.isRequired)]

  function handleUpload(docId: string, file: File) {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
    if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
      setUploadError('pdf, png, jpg 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`파일 크기는 10MB를 초과할 수 없습니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      uploadDocFile(docId, file.name, file.size, session?.name || session?.email || '고객', dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleUrlSave(docId: string, url: string) {
    uploadDocFile(docId, url, 0, session?.name || session?.email || '고객')
  }

  function handleSubmit() {
    if (!session || !canSubmit) return
    const actor = { role: 'CUSTOMER' as const, name: session.name || '고객' }
    const result = isRevision
      ? resubmitRevision(id!, actor)
      : transitionStatus(id!, 'INITIAL_SCREENING', actor)
    if (result.ok) {
      setSubmitted(true)
      setTimeout(() => navigate(`/customer/case/${id}`), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col">
      <TabBar caseId={id} active="documents" />
      <div className="flex flex-col items-center px-4 py-8">

      <div className="w-full max-w-[640px] flex flex-col gap-4">
        {isRevision && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-[12px] p-4">
            <Warning size={20} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-sb-n800 mb-0.5">서류 보완이 요청되었습니다</p>
              <p className="text-[13px] text-sb-n600">
                담당팀에서 서류 보완 또는 추가 제출을 요청했습니다. 아래 표시된 서류를 업로드한 후
                재제출해주세요.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[16px] p-6 flex flex-col gap-5" style={{ boxShadow: 'var(--shadow-200)' }}>
          <div>
            <p className="text-[16px] font-bold text-sb-n900 mb-1">
              {isRevision ? '보완 서류 재제출' : '서류 제출'}
            </p>
            <p className="text-[13px] text-sb-n500">
              {isRevision
                ? '보완 요청된 서류를 업로드한 후 재제출해주세요.'
                : `필수 서류 ${requiredDocs.length}개를 모두 업로드해주세요.`}
            </p>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-[8px] bg-red-50 border border-red-200 text-[13px] text-red-700">
              <Warning size={15} weight="fill" className="flex-shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {displayDocs.map((doc) =>
              doc.type === 'website_url' ? (
                <UrlRow key={doc.id} doc={doc} latestFile={getLatestFile(doc.id)} onSave={handleUrlSave} />
              ) : (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  latestFile={getLatestFile(doc.id)}
                  latestRevision={getLatestRevision(doc.id)}
                  onUpload={handleUpload}
                />
              )
            )}
          </div>
        </div>

        {!isRevision && (
          <div className="bg-white rounded-[16px] px-6 py-4" style={{ boxShadow: 'var(--shadow-200)' }}>
            <div className="flex items-center justify-between text-[13px] mb-2">
              <span className="text-sb-n600">업로드 진행</span>
              <span className="font-medium text-sb-n800">
                {requiredDocs.filter((d) => d.status === 'SUBMITTED' || d.status === 'APPROVED').length}{' '}
                / {requiredDocs.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-sb-n100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sb-brand rounded-full transition-all duration-300"
                style={{
                  width: `${
                    requiredDocs.length
                      ? (requiredDocs.filter(
                          (d) => d.status === 'SUBMITTED' || d.status === 'APPROVED'
                        ).length /
                          requiredDocs.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: 'var(--shadow-200)' }}>
          {!canSubmit && (
            <p className="flex items-center gap-2 text-[13px] text-sb-n500 mb-4">
              <Clock size={14} />
              {isRevision
                ? '보완 요청된 서류를 모두 업로드하면 재제출할 수 있습니다.'
                : '필수 서류를 모두 업로드하면 제출할 수 있습니다.'}
            </p>
          )}
          <Button onClick={handleSubmit} disabled={!canSubmit} fullWidth>
            {isRevision ? '재제출하기' : '제출하기'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
