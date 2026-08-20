'use client'
import styled from '@emotion/styled'
import { CheckCircle, CloudArrowUp, Warning, ArrowRight, Clock, Link } from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, Suspense } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { transitionStatus, resubmitRevision } from '@/src/features/case-actions/api/caseService'
import { colors } from '@/src/shared/const/tokens'
import type { Document, UploadedFile } from '@/src/shared/type'
import Button from '@/src/shared/ui/Button'
import TabBar from '@/src/widgets/customer/tab-bar/ui/TabBar'

// Amber palette for warning/revision state (not in design tokens)
const amber50 = '#fffbeb'
const amber100 = '#fef3c7'
const amber300 = '#fcd34d'
const amber500 = '#f59e0b'
const amber600 = '#d97706'
const amber700 = '#b45309'

const PageWrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${colors.n50};
`

const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
`

const Inner = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const RevisionBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: ${amber50};
  border: 1px solid ${amber300};
  border-radius: 12px;
  padding: 16px;
`

const BannerIcon = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
  color: ${amber500};
`

const BannerTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px;
  color: ${colors.n800};
`

const BannerDesc = styled.p`
  font-size: 13px;
  margin: 0;
  color: ${colors.n600};
`

const DocCard = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-200);
`

const DocCardTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  color: ${colors.n900};
`

const DocCardSubtitle = styled.p`
  font-size: 13px;
  margin: 0;
  color: ${colors.n500};
`

const DocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ProgressCard = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  padding: 16px 24px;
  box-shadow: var(--shadow-200);
`

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  overflow: hidden;
  background: ${colors.n100};
`

const ProgressFill = styled.div<{ pct: number }>`
  height: 100%;
  border-radius: 9999px;
  background: ${colors.brand};
  transition: width 300ms;
  width: ${({ pct }) => pct}%;
`

const SubmitCard = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-200);
`

const SubmitHint = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin: 0 0 16px;
  color: ${colors.n500};
`

// ── UrlRow ──────────────────────────────────────────────────

const UrlRowWrap = styled.div<{ isSubmitted: boolean; needsRevision: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid
    ${({ isSubmitted, needsRevision }) =>
      needsRevision ? amber300 : isSubmitted ? colors.positive : colors.n200};
  background: ${({ isSubmitted, needsRevision }) =>
    needsRevision ? amber50 : isSubmitted ? colors.positiveLight : colors.white};
  transition:
    background 200ms,
    border-color 200ms;
`

const DocRowTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
`

const DocIconWrap = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
`

const DocInfo = styled.div`
  min-width: 0;
  flex: 1;
`

const DocName = styled.p`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  margin: 0;
  color: ${colors.n800};
`

const DocConditionalLabel = styled.p`
  font-size: 11px;
  margin: 2px 0 0;
  color: ${colors.n400};
`

const UrlInputRow = styled.div`
  display: flex;
  gap: 8px;
`

const UrlInput = styled.input`
  flex: 1;
  font-size: 13px;
  border-radius: 6px;
  padding: 6px 12px;
  outline: none;
  border: 1px solid ${colors.n200};
  box-sizing: border-box;
`

const UrlSaveBtn = styled.button`
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${colors.brand};
  font-size: 13px;
  font-weight: 500;
  color: ${colors.brand};
  background: none;
  cursor: pointer;
  transition: opacity 120ms;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

// ── DocRow ───────────────────────────────────────────────────

const DocRowWrap = styled.div<{ isUploaded: boolean; isWarning: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid
    ${({ isUploaded, isWarning }) =>
      isWarning ? amber300 : isUploaded ? colors.positive : colors.n200};
  background: ${({ isUploaded, isWarning }) =>
    isWarning ? amber50 : isUploaded ? colors.positiveLight : colors.white};
  transition:
    background 200ms,
    border-color 200ms;
`

const DocRowLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
`

const DocNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const AdHocBadge = styled.span`
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 9999px;
  background: ${amber100};
  color: ${amber700};
`

const DocUploadedLabel = styled.p`
  font-size: 11px;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${colors.positive};
`

const DocRevisionReason = styled.p`
  font-size: 11px;
  margin: 2px 0 0;
  color: ${amber600};
`

const DocCircleIcon = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 2px solid ${colors.n300};
`

const UploadBtn = styled.button<{ uploaded: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${({ uploaded }) => (uploaded ? colors.n200 : colors.brand)};
  font-size: 13px;
  font-weight: 500;
  color: ${({ uploaded }) => (uploaded ? colors.n500 : colors.brand)};
  background: none;
  cursor: pointer;
  transition: opacity 120ms;
`

const HiddenInput = styled.input`
  display: none;
`

// ── Submitted state ──────────────────────────────────────────

const SuccessWrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${colors.n50};
`

const SuccessCard = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${colors.white};
  border-radius: 20px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  box-shadow: var(--shadow-200);
`

const SuccessTitle = styled.p`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  color: ${colors.n900};
`

const SuccessDesc = styled.p`
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  color: ${colors.n600};
`

// ── Sub-components ───────────────────────────────────────────

function UrlRow({ doc, onSave }: { doc: Document; onSave: (docId: string, url: string) => void }) {
  const isSubmitted = doc.status === 'SUBMITTED' || doc.status === 'APPROVED'
  const needsRevision = doc.status === 'REVISION_REQUIRED'
  const savedUrl = doc.uploadedFiles[doc.uploadedFiles.length - 1]?.fileName ?? ''
  const [url, setUrl] = useState(savedUrl)

  return (
    <UrlRowWrap isSubmitted={isSubmitted} needsRevision={needsRevision}>
      <DocRowTop>
        <DocIconWrap>
          {isSubmitted ? (
            <CheckCircle size={18} weight="fill" color={colors.positive} />
          ) : needsRevision ? (
            <Warning size={18} weight="fill" color={amber500} />
          ) : (
            <Link size={18} color={colors.n400} />
          )}
        </DocIconWrap>
        <DocInfo>
          <DocName>{doc.displayName}</DocName>
          {doc.isConditional && !doc.isRequired && (
            <DocConditionalLabel>조건부 제출</DocConditionalLabel>
          )}
        </DocInfo>
      </DocRowTop>
      <UrlInputRow>
        <UrlInput
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
        <UrlSaveBtn
          type="button"
          onClick={() => {
            if (url.trim()) onSave(doc.id, url.trim())
          }}
          disabled={!url.trim()}
        >
          확인
        </UrlSaveBtn>
      </UrlInputRow>
    </UrlRowWrap>
  )
}

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
  const isAdHocPending = doc.isAdHoc && doc.status === 'REQUESTED'
  const isWarning = !!(needsRevision || isAdHocPending)
  const latestFile = doc.uploadedFiles[doc.uploadedFiles.length - 1]
  const latestRevision = doc.revisionHistory[doc.revisionHistory.length - 1]

  return (
    <DocRowWrap isUploaded={isUploaded && !isWarning} isWarning={isWarning}>
      <DocRowLeft>
        <DocIconWrap>
          {isUploaded ? (
            <CheckCircle size={18} weight="fill" color={colors.positive} />
          ) : isWarning ? (
            <Warning size={18} weight="fill" color={amber500} />
          ) : (
            <DocCircleIcon />
          )}
        </DocIconWrap>
        <div style={{ minWidth: 0 }}>
          <DocNameRow>
            <DocName>{doc.displayName}</DocName>
            {isAdHocPending && <AdHocBadge>제출 필요</AdHocBadge>}
          </DocNameRow>
          {doc.isConditional && !doc.isRequired && (
            <DocConditionalLabel>조건부 제출</DocConditionalLabel>
          )}
          {isUploaded && latestFile && (
            <DocUploadedLabel>{latestFile.fileName} 업로드됨</DocUploadedLabel>
          )}
          {isWarning && latestRevision && (
            <DocRevisionReason>{latestRevision.reason}</DocRevisionReason>
          )}
        </div>
      </DocRowLeft>

      <div>
        <HiddenInput
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(doc.id, file)
            e.target.value = ''
          }}
        />
        <UploadBtn type="button" uploaded={isUploaded} onClick={() => inputRef.current?.click()}>
          <CloudArrowUp size={14} />
          {isUploaded ? '재업로드' : '업로드'}
        </UploadBtn>
      </div>
    </DocRowWrap>
  )
}

// ── PageContent ───────────────────────────────────────────────

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const updateCase = useCaseStore((s) => s.updateCase)
  const [submitted, setSubmitted] = useState(false)

  if (!c || !id) {
    return (
      <SuccessWrap>
        <p style={{ color: colors.n500 }}>케이스를 찾을 수 없습니다.</p>
      </SuccessWrap>
    )
  }

  if (submitted) {
    return (
      <SuccessWrap>
        <SuccessCard>
          <CheckCircle size={52} weight="fill" color={colors.positive} />
          <div>
            <SuccessTitle>서류가 제출되었습니다</SuccessTitle>
            <SuccessDesc>
              담당팀에서 검토 후 연락드리겠습니다.
              <br />
              잠시 후 상태 &amp; 이력으로 이동합니다.
            </SuccessDesc>
          </div>
        </SuccessCard>
      </SuccessWrap>
    )
  }

  const isRevision = c.status === 'REVISION_REQUESTED'
  const requiredDocs = c.documents.filter((d) => d.isRequired)
  const allRequiredUploaded = requiredDocs.every(
    (d) => d.status === 'SUBMITTED' || d.status === 'APPROVED'
  )
  const noRevisionRemaining = !c.documents.some((d) => d.status === 'REVISION_REQUIRED')
  const noAdHocPending = !c.documents.some((d) => d.isAdHoc && d.status === 'REQUESTED')
  const canSubmit = isRevision ? noRevisionRemaining && noAdHocPending : allRequiredUploaded

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
        isLatest: true,
        dataUrl,
      }
      const latestCase = useCaseStore.getState().cases[id!]
      if (!latestCase) return
      const updatedDocs = latestCase.documents.map((d) => {
        if (d.id !== docId) return d
        const prevFiles = d.uploadedFiles.map((f) => ({ ...f, isLatest: false }))
        return {
          ...d,
          status: 'SUBMITTED' as const,
          uploadedFiles: [...prevFiles, newFile],
        }
      })
      updateCase(id!, { documents: updatedDocs })
    }
    reader.readAsDataURL(file)
  }

  function handleUrlSave(docId: string, url: string) {
    const now = Date.now()
    const newFile: UploadedFile = {
      id: `file_${now}`,
      documentId: docId,
      fileName: url,
      fileSize: 0,
      uploadedAt: now,
      uploadedBy: session?.name || session?.email || '고객',
      isLatest: true,
    }
    const latestCase = useCaseStore.getState().cases[id!]
    if (!latestCase) return
    const updatedDocs = latestCase.documents.map((d) => {
      if (d.id !== docId) return d
      return { ...d, status: 'SUBMITTED' as const, uploadedFiles: [...d.uploadedFiles, newFile] }
    })
    updateCase(id!, { documents: updatedDocs })
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

  const uploadedCount = requiredDocs.filter(
    (d) => d.status === 'SUBMITTED' || d.status === 'APPROVED'
  ).length
  const uploadPct = requiredDocs.length ? (uploadedCount / requiredDocs.length) * 100 : 0

  return (
    <PageWrap>
      <TabBar caseId={id} active="documents" />
      <PageBody>
        <Inner>
          {/* Revision banner */}
          {isRevision && (
            <RevisionBanner>
              <BannerIcon>
                <Warning size={20} weight="fill" />
              </BannerIcon>
              <div>
                <BannerTitle>서류 보완이 요청되었습니다</BannerTitle>
                <BannerDesc>
                  담당팀에서 서류 보완 또는 추가 제출을 요청했습니다. 아래 표시된 서류를 업로드한 후
                  재제출해주세요.
                </BannerDesc>
              </div>
            </RevisionBanner>
          )}

          {/* Document list */}
          <DocCard>
            <div>
              <DocCardTitle>{isRevision ? '보완 서류 재제출' : '서류 제출'}</DocCardTitle>
              <DocCardSubtitle>
                {isRevision
                  ? '보완 요청된 서류를 업로드한 후 재제출해주세요.'
                  : `필수 서류 ${requiredDocs.length}개를 모두 업로드해주세요.`}
              </DocCardSubtitle>
            </div>

            <DocList>
              {displayDocs.map((doc) =>
                doc.type === 'website_url' ? (
                  <UrlRow key={doc.id} doc={doc} onSave={handleUrlSave} />
                ) : (
                  <DocRow key={doc.id} doc={doc} onUpload={handleUpload} />
                )
              )}
            </DocList>
          </DocCard>

          {/* Progress indicator */}
          {!isRevision && (
            <ProgressCard>
              <ProgressHeader>
                <span style={{ color: colors.n600 }}>업로드 진행</span>
                <span style={{ fontWeight: 500, color: colors.n800 }}>
                  {uploadedCount} / {requiredDocs.length}
                </span>
              </ProgressHeader>
              <ProgressTrack>
                <ProgressFill pct={uploadPct} />
              </ProgressTrack>
            </ProgressCard>
          )}

          {/* Submit */}
          <SubmitCard>
            {!canSubmit && (
              <SubmitHint>
                <Clock size={14} />
                {isRevision
                  ? '보완 요청된 서류를 모두 업로드하면 재제출할 수 있습니다.'
                  : '필수 서류를 모두 업로드하면 제출할 수 있습니다.'}
              </SubmitHint>
            )}
            <Button onClick={handleSubmit} disabled={!canSubmit} fullWidth>
              {isRevision ? '재제출하기' : '제출하기'}
              <ArrowRight size={16} />
            </Button>
          </SubmitCard>
        </Inner>
      </PageBody>
    </PageWrap>
  )
}

export default function CustomerCaseDocumentsPage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  )
}
