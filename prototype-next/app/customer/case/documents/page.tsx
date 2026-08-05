'use client'
import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, CloudArrowUp, Warning, ArrowRight, Clock, Link } from '@phosphor-icons/react'
import { useCaseStore } from '@/store/caseStore'
import { useDocumentStore } from '@/store/documentStore'
import { useDocumentFileStore } from '@/store/documentFileStore'
import { useRevisionRequestStore } from '@/store/revisionRequestStore'
import { useSessionStore } from '@/store/sessionStore'
import { transitionStatus, resubmitRevision } from '@/services/caseService'
import { uploadFile as uploadDocFile } from '@/services/documentService'
import type { Document, DocumentFile, RevisionRequest } from '@/types'
import Button from '@/components/ui/Button'
import TabBar from '@/components/customer/TabBar'

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
        needsRevision ? 'border-amber-300 bg-amber-50' : isSubmitted ? 'bg-green-50' : 'bg-white'
      }`}
      style={isSubmitted && !needsRevision ? { borderColor: 'var(--sb-positive)' } : needsRevision ? {} : { borderColor: 'var(--sb-n200)' }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {isSubmitted ? (
            <CheckCircle size={18} weight="fill" style={{ color: 'var(--sb-positive)' }} />
          ) : needsRevision ? (
            <Warning size={18} weight="fill" className="text-amber-500" />
          ) : (
            <Link size={18} style={{ color: 'var(--sb-n400)' }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-[20px]" style={{ color: 'var(--sb-n800)' }}>{doc.displayName}</p>
          {doc.isConditional && !doc.isRequired && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--sb-n400)' }}>조건부 제출</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 text-[13px] rounded-[6px] px-3 py-1.5 outline-none border"
          style={{ borderColor: 'var(--sb-n200)' }}
        />
        <button
          type="button"
          onClick={() => { if (url.trim()) onSave(doc.id, url.trim()) }}
          disabled={!url.trim()}
          className="flex-shrink-0 px-3 py-1.5 rounded-[6px] border text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }}
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
          ? 'bg-green-50'
          : 'bg-white'
      }`}
      style={isUploaded && !needsRevision && !isAdHocPending ? { borderColor: 'var(--sb-positive)' } : (!needsRevision && !isAdHocPending) ? { borderColor: 'var(--sb-n200)' } : {}}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {isUploaded ? (
            <CheckCircle size={18} weight="fill" style={{ color: 'var(--sb-positive)' }} />
          ) : needsRevision || isAdHocPending ? (
            <Warning size={18} weight="fill" className="text-amber-500" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2" style={{ borderColor: 'var(--sb-n300)' }} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium leading-[20px]" style={{ color: 'var(--sb-n800)' }}>{doc.displayName}</p>
            {isAdHocPending && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">제출 필요</span>
            )}
          </div>
          {doc.isConditional && !doc.isRequired && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--sb-n400)' }}>조건부 제출</p>
          )}
          {isUploaded && latestFile && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--sb-positive)' }}>{latestFile.fileName} 업로드됨</p>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-[13px] font-medium transition-colors"
          style={isUploaded
            ? { borderColor: 'var(--sb-n200)', color: 'var(--sb-n500)' }
            : { borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }}
        >
          <CloudArrowUp size={14} />
          {isUploaded ? '재업로드' : '업로드'}
        </button>
      </div>
    </div>
  )
}

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const documents = useDocumentStore((s) => s.getByCase(id))
  const allFiles = useDocumentFileStore((s) => s.files)
  const allRevisions = useRevisionRequestStore((s) => s.requests)
  const [submitted, setSubmitted] = useState(false)

  if (!c || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-n50)' }}>
        <p style={{ color: 'var(--sb-n500)' }}>케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--sb-n50)' }}>
        <div className="w-full max-w-[480px] bg-white rounded-[20px] p-10 flex flex-col items-center gap-4 text-center" style={{ boxShadow: 'var(--shadow-200)' }}>
          <CheckCircle size={52} weight="fill" style={{ color: 'var(--sb-positive)' }} />
          <div>
            <p className="text-[18px] font-bold mb-2" style={{ color: 'var(--sb-n900)' }}>서류가 제출되었습니다</p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sb-n600)' }}>
              담당팀에서 검토 후 연락드리겠습니다.<br />잠시 후 상태 & 이력으로 이동합니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getLatestFile = (docId: string) =>
    Object.values(allFiles).find((f) => f.documentId === docId && f.isLatest) ?? null
  const getLatestRevision = (docId: string) =>
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
      : transitionStatus(id!, 'SALES_REVIEW_REQUIRED', actor)
    if (result.ok) {
      setSubmitted(true)
      setTimeout(() => router.push(`/customer/case?id=${id}`), 2000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sb-n50)' }}>
      <TabBar caseId={id} active="documents" />
      <div className="flex flex-col items-center px-4 py-8">

      <div className="w-full max-w-[640px] flex flex-col gap-4">
        {isRevision && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-[12px] p-4">
            <Warning size={20} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--sb-n800)' }}>서류 보완이 요청되었습니다</p>
              <p className="text-[13px]" style={{ color: 'var(--sb-n600)' }}>
                담당팀에서 서류 보완 또는 추가 제출을 요청했습니다. 아래 표시된 서류를 업로드한 후
                재제출해주세요.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[16px] p-6 flex flex-col gap-5" style={{ boxShadow: 'var(--shadow-200)' }}>
          <div>
            <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--sb-n900)' }}>
              {isRevision ? '보완 서류 재제출' : '서류 제출'}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--sb-n500)' }}>
              {isRevision
                ? '보완 요청된 서류를 업로드한 후 재제출해주세요.'
                : `필수 서류 ${requiredDocs.length}개를 모두 업로드해주세요.`}
            </p>
          </div>

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
              <span style={{ color: 'var(--sb-n600)' }}>업로드 진행</span>
              <span className="font-medium" style={{ color: 'var(--sb-n800)' }}>
                {requiredDocs.filter((d) => d.status === 'SUBMITTED' || d.status === 'APPROVED').length}{' '}
                / {requiredDocs.length}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sb-n100)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  background: 'var(--sb-brand)',
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
            <p className="flex items-center gap-2 text-[13px] mb-4" style={{ color: 'var(--sb-n500)' }}>
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

export default function Page() {
  return <Suspense fallback={null}><PageContent /></Suspense>
}
