import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, CloudArrowUp, Warning, ArrowRight, Clock } from '@phosphor-icons/react'
import { useCaseStore } from '../../store/caseStore'
import { useSessionStore } from '../../store/sessionStore'
import { transitionStatus } from '../../services/caseService'
import type { Document, UploadedFile } from '../../types'
import Button from '../../components/ui/Button'
import TabBar from '../../components/customer/TabBar'

function DocRow({
  doc,
  onUpload,
}: {
  doc: Document
  onUpload: (docId: string, file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploaded = doc.status === 'SUBMITTED' || doc.status === 'APPROVED'
  const needsRevision = doc.status === 'REVISION_REQUIRED'
  const latestFile = doc.uploadedFiles[doc.uploadedFiles.length - 1]
  const latestRevision = doc.revisionHistory[doc.revisionHistory.length - 1]

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-[10px] border transition-colors ${
        needsRevision
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
          ) : needsRevision ? (
            <Warning size={18} weight="fill" className="text-amber-500" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-sb-n300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-sb-n800 leading-[20px]">{doc.displayName}</p>
          {doc.isConditional && !doc.isRequired && (
            <p className="text-[11px] text-sb-n400 mt-0.5">조건부 제출</p>
          )}
          {isUploaded && latestFile && (
            <p className="text-[11px] text-sb-positive mt-0.5 truncate">{latestFile.fileName} 업로드됨</p>
          )}
          {needsRevision && latestRevision && (
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
  const updateCase = useCaseStore((s) => s.updateCase)
  const [submitted, setSubmitted] = useState(false)

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

  const isRevision = c.status === 'REVISION_REQUESTED'
  const requiredDocs = c.documents.filter((d) => d.isRequired)
  const allRequiredUploaded = requiredDocs.every(
    (d) => d.status === 'SUBMITTED' || d.status === 'APPROVED'
  )
  const noRevisionRemaining = !c.documents.some((d) => d.status === 'REVISION_REQUIRED')
  const canSubmit = isRevision ? noRevisionRemaining : allRequiredUploaded

  const displayDocs = isRevision
    ? c.documents
    : [...c.documents.filter((d) => d.isRequired), ...c.documents.filter((d) => !d.isRequired)]

  function handleUpload(docId: string, file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const now = Date.now()
      const newFile: UploadedFile = {
        id: `file_${now}`,
        documentId: docId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: now,
        uploadedBy: session?.name || session?.email || '고객',
        dataUrl,
      }
      const latestCase = useCaseStore.getState().cases[id!]
      if (!latestCase) return
      const updatedDocs = latestCase.documents.map((d) => {
        if (d.id !== docId) return d
        return {
          ...d,
          status: 'SUBMITTED' as const,
          uploadedFiles: [...d.uploadedFiles, newFile],
        }
      })
      updateCase(id!, { documents: updatedDocs })
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!session || !canSubmit) return
    const nextStatus = isRevision ? 'COMPLIANCE_REVIEW_REQUIRED' : 'SALES_REVIEW_REQUIRED'
    const result = transitionStatus(id!, nextStatus, {
      role: 'CUSTOMER',
      name: session.name || '고객',
    })
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
        {/* Revision banner */}
        {isRevision && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-[12px] p-4">
            <Warning size={20} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-sb-n800 mb-0.5">서류 보완이 요청되었습니다</p>
              <p className="text-[13px] text-sb-n600">
                컴플라이언스팀에서 일부 서류에 대한 보완을 요청했습니다. 아래 표시된 서류를 다시
                업로드한 후 재제출해주세요.
              </p>
            </div>
          </div>
        )}

        {/* Document list */}
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

          <div className="flex flex-col gap-3">
            {displayDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} onUpload={handleUpload} />
            ))}
          </div>
        </div>

        {/* Progress indicator */}
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

        {/* Submit */}
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
