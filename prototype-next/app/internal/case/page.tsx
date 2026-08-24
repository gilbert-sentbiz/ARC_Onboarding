'use client'
import { Suspense, useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useRouter, useSearchParams } from 'next/navigation'
import JSZip from 'jszip'
import {
  ArrowLeft, CheckCircle, WarningCircle, Clock,
  Note, PaperPlaneTilt, FileText, FileDashed, Check, X, CaretDown, CaretUp, Eye, DownloadSimple,
} from '@phosphor-icons/react'
import { useSessionStore } from '@/store/sessionStore'
import { useCaseStore } from '@/store/caseStore'
import { useDocumentStore } from '@/store/documentStore'
import { useDocumentFileStore } from '@/store/documentFileStore'
import { useRevisionRequestStore } from '@/store/revisionRequestStore'
import { useIntakeResponseStore } from '@/store/intakeResponseStore'
import { useCaseEventStore } from '@/store/caseEventStore'
import { useInternalNoteStore } from '@/store/internalNoteStore'
import { useInternalStaffStore } from '@/store/internalStaffStore'
import { transitionStatus, changeOwner } from '@/services/caseService'
import { approveDocument, requestRevision } from '@/services/documentService'
import { advanceCase, closeCase } from '@/services/api/cases'
import { approveDocument as apiApproveDocument, requestRevision as apiRequestRevision, listDocuments as apiListDocuments } from '@/services/api/documents'
import { STATUS_LABELS } from '@/services/stateMachine'
import { emitNotification } from '@/store/notificationStore'
import type { CaseStatus, CloseReason, DocumentStatus, UserRole, DocumentFile } from '@/types'
import NotificationBell from '@/components/ui/NotificationBell'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function downloadFile(file: DocumentFile) {
  if (!file.dataUrl) return
  const a = document.createElement('a')
  a.href = file.dataUrl
  a.download = file.fileName
  a.click()
}

async function downloadAllDocuments(
  docIds: string[],
  getLatest: (id: string) => DocumentFile | null,
  getDisplayName: (id: string) => string,
  companyName: string,
  caseId: string
): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Set<string>()

  for (const docId of docIds) {
    const latest = getLatest(docId)
    if (!latest?.dataUrl) continue
    const b64Match = latest.dataUrl.match(/^data:[^;]+;base64,(.+)$/)
    if (!b64Match) continue

    const ext = latest.fileName.includes('.') ? latest.fileName.split('.').pop()! : 'bin'
    const base = getDisplayName(docId).replace(/[/\\:*?"<>|]/g, '_')
    let entryName = `${base}.${ext}`
    let counter = 1
    while (usedNames.has(entryName)) { entryName = `${base}_${counter++}.${ext}` }
    usedNames.add(entryName)
    zip.file(entryName, b64Match[1], { base64: true })
  }

  if (usedNames.size === 0) return
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${companyName}_${caseId}_documents.zip`
  a.click()
  URL.revokeObjectURL(url)
}

const DOC_STATUS_BADGE: Record<DocumentStatus, { label: string; cls: string }> = {
  NOT_REQUESTED: { label: '미제출',   cls: 'bg-sb-n100 text-sb-n500' },
  REQUESTED:     { label: '제출 요청', cls: 'bg-blue-50 text-blue-600' },
  SUBMITTED:     { label: '검토중',   cls: 'bg-amber-50 text-amber-600' },
  REVISION_REQUIRED: { label: '보완 요청', cls: 'bg-orange-50 text-orange-600' },
  APPROVED:      { label: '승인 완료', cls: '' },
}

const STATUS_BADGE: Record<CaseStatus, { cls: string; style?: React.CSSProperties }> = {
  INQUIRY_RECEIVED:              { cls: 'bg-sb-n100 text-sb-n600' },
  DOCUMENT_SUBMISSION_REQUIRED:  { cls: 'bg-blue-50 text-blue-600' },
  INITIAL_SCREENING:             { cls: 'bg-amber-50 text-amber-600' },
  DOCUMENT_SCREENING_REQUIRED:   { cls: 'bg-amber-50 text-amber-700' },
  APPROVAL_REVIEW_REQUIRED:      { cls: 'bg-purple-50 text-purple-600' },
  ACCOUNT_SETUP_REQUIRED:        { cls: 'bg-cyan-50 text-cyan-700' },
  REVISION_REQUESTED:            { cls: 'bg-orange-50 text-orange-600' },
  COMPLETED:                     { cls: 'bg-sb-positive-light' },
  CLOSED:                        { cls: 'bg-sb-n100 text-sb-n500' },
}

function IntakeDataDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(data).map(([key, val]) => {
        if (val === null || val === undefined || val === '') return null
        if (typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key}>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-1"
                style={{ color: 'var(--sb-n400)' }}
              >{key}</p>
              <div
                className="pl-3 border-l-2"
                style={{ borderColor: 'var(--sb-n100)' }}
              >
                <IntakeDataDisplay data={val as Record<string, unknown>} />
              </div>
            </div>
          )
        }
        const display = Array.isArray(val) ? (val as unknown[]).join(', ') : String(val)
        return (
          <div key={key} className="grid grid-cols-[180px_1fr] gap-2 items-start">
            <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>{key}</span>
            <span className="text-[13px]" style={{ color: 'var(--sb-n800)' }}>{display || '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── action bar types ──────────────────────────────────────────────────────────

type ActionDef = {
  label: string
  to: CaseStatus
  closeReason?: CloseReason
  variant: 'primary' | 'outline' | 'danger'
  needsNote: boolean
  isConfirmOnly?: boolean
}

function getActions(role: UserRole, status: CaseStatus): ActionDef[] {
  if (role === 'SALES' && status === 'INITIAL_SCREENING') {
    return [
      { label: '1차 스크리닝 완료', to: 'DOCUMENT_SCREENING_REQUIRED', variant: 'primary', needsNote: false },
      { label: '반려 (종료)', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  if (role === 'OPS' && status === 'DOCUMENT_SCREENING_REQUIRED') {
    return [
      { label: '서류 스크리닝 완료', to: 'APPROVAL_REVIEW_REQUIRED', variant: 'primary', needsNote: false },
      { label: '보완 요청', to: 'REVISION_REQUESTED', variant: 'outline', needsNote: true },
      { label: '케이스 종료', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  if (role === 'COMPLIANCE' && status === 'APPROVAL_REVIEW_REQUIRED') {
    return [
      { label: '심사 승인', to: 'ACCOUNT_SETUP_REQUIRED', variant: 'primary', needsNote: false },
      { label: '보완 요청', to: 'REVISION_REQUESTED', variant: 'outline', needsNote: true },
      { label: '서류 스크리닝 반려', to: 'DOCUMENT_SCREENING_REQUIRED', variant: 'outline', needsNote: true },
      { label: '케이스 종료', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  if (role === 'OPS' && status === 'ACCOUNT_SETUP_REQUIRED') {
    return [
      { label: '계정 생성', to: 'COMPLETED', variant: 'primary', needsNote: false, isConfirmOnly: true },
      { label: '컴플라이언스 반려', to: 'APPROVAL_REVIEW_REQUIRED', variant: 'outline', needsNote: true },
      { label: '케이스 종료', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  return []
}

// ── main component ────────────────────────────────────────────────────────────

type TabKey = 'info' | 'docs' | 'history'

function CaseDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const updateCase = useCaseStore((s) => s.updateCase)
  const { getNotes, addNote } = useInternalNoteStore()
  const staff = useInternalStaffStore((s) => s.staff)

  const documents = useDocumentStore(useShallow((s) => s.getByCase(id)))
  const allFiles = useDocumentFileStore((s) => s.files)
  const allRevisions = useRevisionRequestStore((s) => s.requests)
  const firstIntake = useIntakeResponseStore((s) => id ? s.getByCase(id, 'first') : null)
  const secondIntake = useIntakeResponseStore((s) => id ? s.getByCase(id, 'second') : null)
  const events = useCaseEventStore(useShallow((s) => id ? s.getByCase(id) : []))

  const [tab, setTab] = useState<TabKey>('info')
  const [pendingAction, setPendingAction] = useState<ActionDef | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [docRevisionId, setDocRevisionId] = useState<string | null>(null)
  const [docRevisionNote, setDocRevisionNote] = useState('')
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null)
  const [expandedDocFiles, setExpandedDocFiles] = useState<Set<string>>(new Set())
  const [ownerChangeMode, setOwnerChangeMode] = useState(false)
  const [selectedNewOwner, setSelectedNewOwner] = useState('')

  // PI-225 ②: 백엔드 연동용 토큰 + 문서 type→backend docId 매핑(C9)
  const token = useSessionStore((s) => s.token)
  const backendId = c?.backendId
  const [backendDocMap, setBackendDocMap] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!token || !backendId) return
    let cancelled = false
    apiListDocuments(backendId, token)
      .then((docs) => {
        if (cancelled || !docs) return
        const m: Record<string, string> = {}
        for (const d of docs) m[d.type] = d.id
        setBackendDocMap(m)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token, backendId])

  if (!c || !id || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-n50)' }}>
        <p style={{ color: 'var(--sb-n500)' }}>케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  // Non-null aliases so closures below don't lose narrowing
  const caseId: string = id
  const caseObj = c
  const sess = session

  const role = sess.role as UserRole
  const actions = getActions(role, caseObj.status)
  const notes = getNotes(caseId)

  // ── file/revision helpers ──
  const getLatestFile = (docId: string): DocumentFile | null =>
    Object.values(allFiles).find((f) => f.documentId === docId && f.isLatest) ?? null

  const getDocFiles = (docId: string): DocumentFile[] =>
    Object.values(allFiles).filter((f) => f.documentId === docId).sort((a, b) => a.uploadedAt - b.uploadedAt)

  const getActiveRevisions = (docId: string) =>
    Object.values(allRevisions).filter((r) => r.documentId === docId && !r.resolvedAt)

  const getAllRevisions = (docId: string) =>
    Object.values(allRevisions).filter((r) => r.documentId === docId)

  // ── document handlers ──
  // 로컬 docId → 백엔드 docId (type 경유)
  const toBackendDocId = (docId: string): string | undefined => {
    const t = documents.find((d) => d.id === docId)?.type
    return t ? backendDocMap[t] : undefined
  }

  function approveDoc(docId: string) {
    approveDocument(docId, '', sess.name)
    // PI-225 ②: 백엔드 서류 승인(I6)
    const beDoc = toBackendDocId(docId)
    if (token && beDoc) apiApproveDocument(beDoc, token).catch(() => {})
  }

  function requestDocRevision(docId: string) {
    if (!docRevisionNote.trim()) return
    requestRevision(docId, docRevisionNote, sess.name)
    // PI-225 ②: 백엔드 서류 보완요청(I5)
    const beDoc = toBackendDocId(docId)
    if (token && beDoc) apiRequestRevision(beDoc, { reason: docRevisionNote }, token).catch(() => {})
    if (caseObj.status !== 'REVISION_REQUESTED') {
      transitionStatus(caseId, 'REVISION_REQUESTED', { role, name: sess.name })
    } else {
      emitNotification({
        type: 'REVISION_REQUESTED',
        caseId,
        caseLabel: caseObj.customerName || caseObj.customerEmail,
        message: `'${caseObj.customerName || caseObj.customerEmail}' 케이스에 서류 보완이 요청되었습니다.`,
        recipient: { role: 'CUSTOMER', userId: caseObj.customerId },
      })
    }
    setDocRevisionId(null)
    setDocRevisionNote('')
  }

  function toggleDocFilesExpand(docId: string) {
    setExpandedDocFiles(prev => {
      const next = new Set(prev)
      next.has(docId) ? next.delete(docId) : next.add(docId)
      return next
    })
  }

  function confirmOwnerChange() {
    if (!selectedNewOwner) return
    changeOwner(caseId, selectedNewOwner, { role, name: sess.name })
    setOwnerChangeMode(false)
    setSelectedNewOwner('')
  }

  // ── case action handler ──
  function executeAction(action: ActionDef) {
    if (action.needsNote && !actionNote.trim()) return
    const result = transitionStatus(
      caseId,
      action.to,
      { role, name: sess.name },
      actionNote || undefined,
    )
    if (result.ok) {
      if (action.closeReason) {
        updateCase(caseId, { closeReason: action.closeReason })
      }
      // PI-225 ②: 백엔드 반영 — 종료(CLOSED)=close(I4), 그 외 전진=advance(I3)
      if (token && backendId) {
        if (action.to === 'CLOSED') {
          const reason = action.closeReason === 'EXITED' ? 'EXITED' : 'DROPPED'
          closeCase(backendId, { reason }, token).catch(() => {})
        } else {
          advanceCase(backendId, token).catch(() => {})
        }
      }
      setPendingAction(null)
      setActionNote('')
      router.push('/internal/dashboard')
    }
  }

  // ── note handler ──
  function sendNote() {
    if (!noteInput.trim()) return
    addNote(caseId, { role, name: sess.name }, noteInput.trim())
    setNoteInput('')
  }

  // ── render ──
  const SEGMENT_LABEL: Record<string, string> = {
    'ENTITY_CORP': '법인',
    'ENTITY_INDIV': '개인사업자',
    'ENTITY_FI': 'FI',
    'SentBiz Corporate': '법인',
    'SentBiz Individual': '개인사업자',
    'FI': 'FI',
  }
  const SERVICE_LABEL: Record<string, string> = {
    'SVC_COL_KRW': 'KRW Collection',
    'SVC_COL_VND': 'VND Collection',
    'SVC_COL_ETC': '기타 Collection',
    'SVC_PAYOUT': 'Payout',
    'SVC_KRW': 'KRW Collection',
    'SVC_VND': 'VND Collection',
    'SVC_ETC': '기타 Collection',
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sb-n50)' }}>
      {/* Header */}
      <header className="bg-white sticky top-0 z-10" style={{ borderBottom: '1px solid var(--sb-n100)' }}>
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => router.push('/internal/dashboard')}
            className="flex items-center gap-1.5 text-[13px] transition-colors flex-shrink-0"
            style={{ color: 'var(--sb-n500)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-n800)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-n500)')}
          >
            <ArrowLeft size={16} />
            대시보드
          </button>
          <div className="h-4 w-px" style={{ background: 'var(--sb-n200)' }} />
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <span className="text-[15px] font-semibold truncate" style={{ color: 'var(--sb-n900)' }}>
              {c.customerName || c.customerEmail}
            </span>
            <span
              className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[c.status].cls}`}
              style={c.status === 'COMPLETED' ? { color: 'var(--sb-positive)' } : c.status === 'INQUIRY_RECEIVED' ? { color: 'var(--sb-n600)' } : c.status === 'CLOSED' ? { color: 'var(--sb-n500)' } : undefined}
            >
              {STATUS_LABELS[c.status]}
            </span>
            <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--sb-n400)' }}>
              {SEGMENT_LABEL[c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''] ?? (c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment)}
              {(() => {
                const svcs = c.segmentInfo?.services ?? c.segmentInfo?.serviceSegments ?? []
                if (svcs.length === 0) return null
                return ` · ${svcs.map((s: string) => SERVICE_LABEL[s] ?? s).join(' · ')}`
              })()}
            </span>
            {/* 담당자 표시 + 변경 */}
            {c.currentOwner?.role !== 'CUSTOMER' && c.currentOwner && (
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className="text-[12px]" style={{ color: 'var(--sb-n400)' }}>담당자:</span>
                {ownerChangeMode ? (
                  <>
                    <select
                      value={selectedNewOwner}
                      onChange={(e) => setSelectedNewOwner(e.target.value)}
                      className="text-[12px] rounded-[6px] px-2 py-0.5 focus:outline-none"
                      style={{ border: '1px solid var(--sb-n200)', color: 'var(--sb-n800)' }}
                    >
                      <option value="">선택</option>
                      {staff.filter(s => s.role === c.currentOwner?.role).map(s => (
                        <option key={s.email} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={confirmOwnerChange}
                      disabled={!selectedNewOwner}
                      className="text-[12px] hover:underline disabled:opacity-40"
                      style={{ color: 'var(--sb-brand)' }}
                    >확인</button>
                    <button
                      onClick={() => { setOwnerChangeMode(false); setSelectedNewOwner('') }}
                      className="text-[12px]"
                      style={{ color: 'var(--sb-n400)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-n700)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-n400)')}
                    >취소</button>
                  </>
                ) : (
                  <>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--sb-n800)' }}>{c.currentOwner.name}</span>
                    <button
                      onClick={() => setOwnerChangeMode(true)}
                      className="text-[11px] hover:underline"
                      style={{ color: 'var(--sb-brand)' }}
                    >변경</button>
                  </>
                )}
              </div>
            )}
          </div>
          <NotificationBell role={role} name={sess.name} />
        </div>

        {/* Tab bar */}
        <div className="max-w-[1200px] mx-auto px-6 flex gap-1">
          {([
            { key: 'info', label: '고객정보' },
            { key: 'docs', label: '서류' },
            { key: 'history', label: '이력' },
          ] as { key: TabKey; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors"
              style={
                tab === t.key
                  ? { borderColor: 'var(--sb-brand)', color: 'var(--sb-brand)' }
                  : { borderColor: 'transparent', color: 'var(--sb-n500)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-8 pb-36">

        {/* ── 고객정보 탭 ── */}
        {tab === 'info' && (
          <div className="flex flex-col gap-6 max-w-[800px]">
            <div
              className="bg-white rounded-[12px] p-6 flex flex-col gap-4"
              style={{ border: '1px solid var(--sb-n100)' }}
            >
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--sb-n900)' }}>1차 입력 정보</h3>
              {Object.keys(firstIntake?.answers ?? {}).length > 0 ? (
                <IntakeDataDisplay data={firstIntake!.answers as Record<string, unknown>} />
              ) : (
                <p className="text-[13px]" style={{ color: 'var(--sb-n400)' }}>입력 데이터가 없습니다.</p>
              )}
            </div>

            {secondIntake?.status !== 'not_started' && secondIntake && (
              <div
                className="bg-white rounded-[12px] p-6 flex flex-col gap-4"
                style={{ border: '1px solid var(--sb-n100)' }}
              >
                <h3 className="text-[14px] font-semibold" style={{ color: 'var(--sb-n900)' }}>2차 입력 정보</h3>
                {Object.keys(secondIntake?.answers ?? {}).length > 0 ? (
                  <IntakeDataDisplay data={secondIntake.answers as Record<string, unknown>} />
                ) : (
                  <p className="text-[13px]" style={{ color: 'var(--sb-n400)' }}>입력 데이터가 없습니다.</p>
                )}
              </div>
            )}

            <div
              className="bg-white rounded-[12px] p-6 flex flex-col gap-3"
              style={{ border: '1px solid var(--sb-n100)' }}
            >
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--sb-n900)' }}>세그먼트 판단</h3>
              <div className="grid grid-cols-[180px_1fr] gap-2">
                <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>Entity</span>
                <span className="text-[13px]" style={{ color: 'var(--sb-n800)' }}>{SEGMENT_LABEL[c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''] ?? (c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment) ?? '—'}</span>
                <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>Service</span>
                <span className="text-[13px]" style={{ color: 'var(--sb-n800)' }}>{(c.segmentInfo?.services ?? c.segmentInfo?.serviceSegments ?? []).map((s: string) => SERVICE_LABEL[s] ?? s).join(', ') || '—'}</span>
                {(c.segmentInfo?.sectors?.length ?? 0) > 0 && (<>
                  <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>Sector</span>
                  <span className="text-[13px]" style={{ color: 'var(--sb-n800)' }}>{c.segmentInfo.sectors.join(', ')}</span>
                </>)}
                <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>설립 국가</span>
                <span className="text-[13px]" style={{ color: 'var(--sb-n800)' }}>{c.segmentInfo?.foundingCountry || '—'}</span>
                <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>월간 거래 규모</span>
                <span className="text-[13px]" style={{ color: 'var(--sb-n800)' }}>
                  {c.segmentInfo?.monthlyVolume ? `${c.segmentInfo.monthlyVolume} ${c.segmentInfo.monthlyVolumeCurrency}` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── 서류 탭 ── */}
        {tab === 'docs' && (
          <div className="flex flex-col gap-4 max-w-[800px]">
            {documents.length === 0 ? (
              <div
                className="bg-white rounded-[12px] p-12 flex flex-col items-center gap-3 text-center"
                style={{ border: '1px solid var(--sb-n100)' }}
              >
                <FileDashed size={36} style={{ color: 'var(--sb-n300)' }} />
                <p className="text-[14px]" style={{ color: 'var(--sb-n400)' }}>서류 목록이 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div />
                  {(role === 'SALES' || role === 'COMPLIANCE' || role === 'OPS') && (() => {
                    const hasUploads = documents.some(doc => !!getLatestFile(doc.id)?.dataUrl)
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadAllDocuments(
                            documents.map(d => d.id),
                            getLatestFile,
                            (docId) => documents.find(d => d.id === docId)?.displayName ?? docId,
                            c.customerName,
                            c.id,
                          )}
                          disabled={!hasUploads}
                          title={!hasUploads ? '업로드된 서류가 없습니다' : undefined}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ border: '1px solid var(--sb-n200)', color: 'var(--sb-n700)' }}
                        >
                          <DownloadSimple size={14} weight="bold" />
                          일괄 다운로드
                        </button>
                      </div>
                    )
                  })()}
                </div>

                {documents.map((doc) => {
                  const badge = DOC_STATUS_BADGE[doc.status]
                  const isRevisionOpen = docRevisionId === doc.id
                  const latestFile = getLatestFile(doc.id)
                  const docFiles = getDocFiles(doc.id)
                  const oldFiles = docFiles.filter(f => f.id !== latestFile?.id)
                  const activeRevisions = getActiveRevisions(doc.id)
                  const allDocRevisions = getAllRevisions(doc.id)
                  const isExpanded = expandedDocFiles.has(doc.id)
                  const badgeStyle: React.CSSProperties = doc.status === 'NOT_REQUESTED'
                    ? { background: 'var(--sb-n100)', color: 'var(--sb-n500)' }
                    : doc.status === 'APPROVED'
                    ? { background: 'var(--sb-positive-light)', color: 'var(--sb-positive)' }
                    : {}
                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-[12px] p-5 flex flex-col gap-3"
                      style={{ border: '1px solid var(--sb-n100)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <FileText size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sb-n400)' }} />
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[14px] font-medium" style={{ color: 'var(--sb-n900)' }}>{doc.displayName}</span>
                            {latestFile && (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setPreviewFile(latestFile)}
                                    className="flex items-center gap-1 text-[12px] hover:underline text-left"
                                    style={{ color: 'var(--sb-brand)' }}
                                  >
                                    <Eye size={12} />
                                    {latestFile.fileName}
                                    <span className="font-normal ml-1" style={{ color: 'var(--sb-n400)' }}>{formatDate(latestFile.uploadedAt)}</span>
                                  </button>
                                  {latestFile.dataUrl && (
                                    <button
                                      onClick={() => downloadFile(latestFile)}
                                      className="flex items-center gap-0.5 text-[11px] transition-colors flex-shrink-0"
                                      style={{ color: 'var(--sb-n400)' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-n700)')}
                                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-n400)')}
                                    >
                                      <DownloadSimple size={12} />
                                      다운로드
                                    </button>
                                  )}
                                </div>
                                {oldFiles.length > 0 && (
                                  <>
                                    <button
                                      onClick={() => toggleDocFilesExpand(doc.id)}
                                      className="flex items-center gap-1 text-[11px] text-left"
                                      style={{ color: 'var(--sb-n400)' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-n700)')}
                                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-n400)')}
                                    >
                                      {isExpanded ? <CaretUp size={10} /> : <CaretDown size={10} />}
                                      이전 제출본 {oldFiles.length}건
                                    </button>
                                    {isExpanded && oldFiles.map(f => (
                                      <div key={f.id} className="flex items-center gap-2 pl-3">
                                        <button
                                          onClick={() => setPreviewFile(f)}
                                          className="text-[11px] hover:underline text-left"
                                          style={{ color: 'var(--sb-n400)' }}
                                        >
                                          {f.fileName} ({formatDate(f.uploadedAt)})
                                        </button>
                                        {f.dataUrl && (
                                          <button
                                            onClick={() => downloadFile(f)}
                                            className="flex-shrink-0 transition-colors"
                                            style={{ color: 'var(--sb-n400)' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-n700)')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-n400)')}
                                          >
                                            <DownloadSimple size={11} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                            {doc.isAdHoc && (
                              <span className="text-[12px] text-blue-500">
                                추가 요청 ({doc.requestedBy}) · {activeRevisions[0]?.reason}
                              </span>
                            )}
                            {!doc.isAdHoc && allDocRevisions.length > 0 && (
                              <span className="text-[12px] text-orange-500">
                                보완 사유: {activeRevisions[activeRevisions.length - 1]?.reason || allDocRevisions[allDocRevisions.length - 1]?.reason || '(사유 없음)'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              doc.status === 'NOT_REQUESTED' || doc.status === 'APPROVED' ? '' : badge.cls
                            }`}
                            style={badgeStyle}
                          >
                            {badge.label}
                          </span>
                          {doc.status === 'SUBMITTED' && (
                            <>
                              {role === 'COMPLIANCE' && (
                                <button
                                  onClick={() => approveDoc(doc.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium hover:opacity-80 transition-opacity"
                                  style={{ background: 'var(--sb-positive-light)', color: 'var(--sb-positive)' }}
                                >
                                  <Check size={13} weight="bold" />
                                  승인
                                </button>
                              )}
                              {(role === 'COMPLIANCE' || role === 'SALES' || role === 'OPS') && (
                                <button
                                  onClick={() => {
                                    setDocRevisionId(isRevisionOpen ? null : doc.id)
                                    setDocRevisionNote('')
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-orange-50 text-orange-600 hover:opacity-80 transition-opacity"
                                >
                                  <X size={13} weight="bold" />
                                  보완요청
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {isRevisionOpen && (
                        <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid var(--sb-n100)' }}>
                          <input
                            className="flex-1 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none"
                            style={{ border: '1px solid var(--sb-n200)', color: 'var(--sb-n800)' }}
                            placeholder="보완 요청 사유를 입력하세요"
                            value={docRevisionNote}
                            onChange={(e) => setDocRevisionNote(e.target.value)}
                          />
                          <button
                            onClick={() => requestDocRevision(doc.id)}
                            disabled={!docRevisionNote.trim()}
                            className="px-3 py-2 rounded-[8px] text-[12px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            전송
                          </button>
                          <button
                            onClick={() => { setDocRevisionId(null); setDocRevisionNote('') }}
                            className="px-3 py-2 rounded-[8px] text-[12px] transition-colors"
                            style={{ color: 'var(--sb-n500)' }}
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ── 이력 탭 ── */}
        {tab === 'history' && (
          <div className="grid grid-cols-[1fr_360px] gap-6 max-w-[1100px]">
            {/* Left: timeline */}
            <div className="flex flex-col gap-4">
              <div
                className="bg-white rounded-[12px] p-6"
                style={{ border: '1px solid var(--sb-n100)' }}
              >
                <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--sb-n900)' }}>상태 변경 이력</h3>
                <div className="flex flex-col gap-0">
                  {events.map((e, i) => {
                    const isOwnerChange = e.eventType === 'ASSIGNEE_CHANGED'
                    return (
                      <div key={e.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={
                              i === 0
                                ? { background: 'var(--sb-brand)' }
                                : isOwnerChange
                                ? { background: 'var(--sb-n50)', border: '1px solid var(--sb-n200)' }
                                : { background: 'var(--sb-n100)' }
                            }
                          >
                            {i === 0
                              ? <CheckCircle size={14} weight="fill" className="text-white" />
                              : isOwnerChange
                              ? <span className="text-[10px]" style={{ color: 'var(--sb-n500)' }}>↔</span>
                              : <Clock size={14} style={{ color: 'var(--sb-n400)' }} />
                            }
                          </div>
                          {i < events.length - 1 && (
                            <div className="w-px flex-1 min-h-[20px] my-1" style={{ background: 'var(--sb-n100)' }} />
                          )}
                        </div>
                        <div className="pb-4 min-w-0">
                          <p
                            className="text-[13px] font-medium"
                            style={{ color: isOwnerChange ? 'var(--sb-n500)' : 'var(--sb-n800)' }}
                          >
                            {isOwnerChange
                              ? '담당자 변경'
                              : (STATUS_LABELS[e.payload.newStatus as CaseStatus] ?? e.payload.newStatus)}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--sb-n400)' }}>
                            {formatDate(e.createdAt)} · {e.actorName}
                          </p>
                          {e.payload.notes && (
                            <p
                              className="text-[12px] mt-0.5 rounded-[6px] px-2 py-1"
                              style={{ color: 'var(--sb-n600)', background: 'var(--sb-n50)' }}
                            >{e.payload.notes}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: notes */}
            <div className="flex flex-col gap-4">
              {/* Internal notes */}
              <div
                className="bg-white rounded-[12px] p-5 flex flex-col gap-3"
                style={{ border: '1px solid var(--sb-n100)' }}
              >
                <h3 className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--sb-n900)' }}>
                  <Note size={15} />
                  내부 노트 <span className="text-[11px] font-normal" style={{ color: 'var(--sb-n400)' }}>(고객 비공개)</span>
                </h3>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-[12px] text-center py-4" style={{ color: 'var(--sb-n400)' }}>내부 노트가 없습니다.</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="bg-amber-50 rounded-[8px] px-3 py-2">
                        <p className="text-[12px] text-amber-800">{note.text}</p>
                        <p className="text-[10px] text-amber-500 mt-0.5">{note.author.name} · {formatDate(note.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--sb-n100)' }}>
                  <input
                    className="flex-1 rounded-[8px] px-3 py-2 text-[12px] focus:outline-none"
                    style={{ border: '1px solid var(--sb-n200)', color: 'var(--sb-n800)' }}
                    placeholder="내부 메모 작성"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendNote() } }}
                  />
                  <button
                    onClick={sendNote}
                    className="px-3 py-2 rounded-[8px] bg-amber-400 text-white hover:bg-amber-500 transition-colors flex items-center"
                  >
                    <PaperPlaneTilt size={14} weight="fill" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      {actions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white z-20" style={{ borderTop: '1px solid var(--sb-n100)' }}>
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-3">
            {pendingAction && (
              <div className="flex gap-2 items-start">
                {pendingAction.isConfirmOnly ? (
                  <>
                    <p className="flex-1 text-[13px] self-center" style={{ color: 'var(--sb-n700)' }}>
                      <span className="font-medium">{pendingAction.label}</span>을 실행하시겠습니까?
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => executeAction(pendingAction)}
                        className="px-4 py-2 rounded-[8px] text-[13px] font-medium text-white hover:opacity-90 transition-colors"
                        style={{ background: 'var(--sb-brand)' }}
                      >
                        확인
                      </button>
                      <button
                        onClick={() => { setPendingAction(null); setActionNote('') }}
                        className="px-4 py-2 rounded-[8px] text-[13px] transition-colors"
                        style={{ color: 'var(--sb-n500)' }}
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--sb-n600)' }}>
                        {pendingAction.label} — {pendingAction.needsNote ? '사유를 입력하세요 (필수)' : '메모 (선택)'}
                      </p>
                      <textarea
                        className="w-full rounded-[8px] px-3 py-2 text-[13px] focus:outline-none resize-none"
                        style={{ border: '1px solid var(--sb-n200)', color: 'var(--sb-n800)' }}
                        rows={2}
                        placeholder="사유를 입력하세요"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 pt-5">
                      <button
                        onClick={() => executeAction(pendingAction)}
                        disabled={pendingAction.needsNote && !actionNote.trim()}
                        className="px-4 py-2 rounded-[8px] text-[13px] font-medium text-white hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'var(--sb-brand)' }}
                      >
                        확인
                      </button>
                      <button
                        onClick={() => { setPendingAction(null); setActionNote('') }}
                        className="px-4 py-2 rounded-[8px] text-[13px] transition-colors"
                        style={{ color: 'var(--sb-n500)' }}
                      >
                        취소
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (pendingAction?.label === action.label) {
                      setPendingAction(null)
                      setActionNote('')
                    } else {
                      setPendingAction(action)
                      setActionNote('')
                    }
                  }}
                  className={`px-4 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                    pendingAction?.label === action.label ? 'ring-2 ring-offset-1' : ''
                  }`}
                  style={
                    action.variant === 'primary'
                      ? {
                          background: 'var(--sb-brand)',
                          color: 'white',
                          ...(pendingAction?.label === action.label ? { outlineColor: 'var(--sb-brand)' } : {}),
                        }
                      : action.variant === 'danger'
                      ? {
                          background: 'white',
                          color: 'var(--sb-negative)',
                          border: '1px solid var(--sb-negative)',
                        }
                      : {
                          background: 'white',
                          color: 'var(--sb-n700)',
                          border: '1px solid var(--sb-n200)',
                        }
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File preview modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-[16px] max-w-[800px] w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--sb-n100)' }}>
              <span className="text-[14px] font-medium truncate pr-4" style={{ color: 'var(--sb-n900)' }}>{previewFile.fileName}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {previewFile.dataUrl && (
                  <button
                    onClick={() => downloadFile(previewFile)}
                    className="flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-[6px] transition-colors"
                    style={{ color: 'var(--sb-n700)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-n900)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-n700)')}
                  >
                    <DownloadSimple size={14} />
                    다운로드
                  </button>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-[13px] px-3 py-1.5 rounded-[6px] transition-colors"
                  style={{ color: 'var(--sb-n500)' }}
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5 flex items-center justify-center min-h-[300px]">
              {previewFile.dataUrl && previewFile.dataUrl.startsWith('data:image') ? (
                <img src={previewFile.dataUrl} alt={previewFile.fileName} className="max-w-full max-h-[70vh] object-contain" />
              ) : previewFile.dataUrl ? (
                <iframe src={previewFile.dataUrl} title={previewFile.fileName} className="w-full h-[70vh] border-0" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <FileText size={48} style={{ color: 'var(--sb-n300)' }} />
                  <p className="text-[14px]" style={{ color: 'var(--sb-n500)' }}>{previewFile.fileName}</p>
                  <p className="text-[12px]" style={{ color: 'var(--sb-n400)' }}>미리보기를 지원하지 않는 파일입니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVISION_REQUESTED 상태 안내 */}
      {c.status === 'REVISION_REQUESTED' && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-50 border-t border-orange-200 z-20 px-6 py-3">
          <div className="max-w-[1200px] mx-auto flex items-center gap-2">
            <WarningCircle size={16} className="text-orange-500 flex-shrink-0" />
            <p className="text-[13px] text-orange-700">고객의 서류 보완을 기다리는 중입니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InternalCasePage() {
  return <Suspense fallback={null}><CaseDetailContent /></Suspense>
}
