import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, WarningCircle, Clock, ChatCircle,
  Note, PaperPlaneTilt, FileText, FileDashed, Check, X,
} from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import { useCaseStore } from '../../store/caseStore'
import { useInternalNoteStore } from '../../store/internalNoteStore'
import { transitionStatus } from '../../services/caseService'
import { STATUS_LABELS } from '../../services/stateMachine'
import type { CaseStatus, CloseReason, DocumentStatus, UserRole, Message } from '../../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const DOC_STATUS_BADGE: Record<DocumentStatus, { label: string; cls: string }> = {
  NOT_REQUESTED: { label: '요청 전',  cls: 'bg-sb-n100 text-sb-n500' },
  REQUESTED:     { label: '제출 요청', cls: 'bg-blue-50 text-blue-600' },
  SUBMITTED:     { label: '검토중',   cls: 'bg-amber-50 text-amber-600' },
  REVISION_REQUIRED: { label: '보완 요청', cls: 'bg-orange-50 text-orange-600' },
  APPROVED:      { label: '승인 완료', cls: 'bg-sb-positive-light text-sb-positive' },
}

const STATUS_BADGE: Record<CaseStatus, string> = {
  INQUIRY_RECEIVED:           'bg-sb-n100 text-sb-n600',
  DOCUMENT_SUBMISSION_REQUIRED: 'bg-blue-50 text-blue-600',
  SALES_REVIEW_REQUIRED:      'bg-amber-50 text-amber-600',
  COMPLIANCE_REVIEW_REQUIRED: 'bg-purple-50 text-purple-600',
  REVISION_REQUESTED:         'bg-orange-50 text-orange-600',
  OPS_REVIEW_REQUIRED:        'bg-cyan-50 text-cyan-700',
  COMPLETED:                  'bg-sb-positive-light text-sb-positive',
  CLOSED:                     'bg-sb-n100 text-sb-n500',
}

function IntakeDataDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(data).map(([key, val]) => {
        if (val === null || val === undefined || val === '') return null
        if (typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key}>
              <p className="text-[11px] font-semibold text-sb-n400 uppercase tracking-[0.5px] mb-1">{key}</p>
              <div className="pl-3 border-l-2 border-sb-n100">
                <IntakeDataDisplay data={val as Record<string, unknown>} />
              </div>
            </div>
          )
        }
        const display = Array.isArray(val) ? (val as unknown[]).join(', ') : String(val)
        return (
          <div key={key} className="grid grid-cols-[180px_1fr] gap-2 items-start">
            <span className="text-[12px] text-sb-n500">{key}</span>
            <span className="text-[13px] text-sb-n800">{display || '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── action bar types ──────────────────────────────────────────────────────────

interface ActionDef {
  label: string
  to: CaseStatus
  closeReason?: CloseReason
  variant: 'primary' | 'outline' | 'danger'
  needsNote: boolean
}

function getActions(role: UserRole, status: CaseStatus): ActionDef[] {
  if (role === 'SALES' && status === 'SALES_REVIEW_REQUIRED') {
    return [
      { label: '1차 스크리닝 완료', to: 'COMPLIANCE_REVIEW_REQUIRED', variant: 'primary', needsNote: false },
      { label: '반려 (종료)', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  if (role === 'COMPLIANCE' && status === 'COMPLIANCE_REVIEW_REQUIRED') {
    return [
      { label: '서류 승인', to: 'OPS_REVIEW_REQUIRED', variant: 'primary', needsNote: false },
      { label: '보완 요청', to: 'REVISION_REQUESTED', variant: 'outline', needsNote: true },
      { label: '영업 반려', to: 'SALES_REVIEW_REQUIRED', variant: 'outline', needsNote: true },
      { label: '케이스 종료', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  if (role === 'OPS' && status === 'OPS_REVIEW_REQUIRED') {
    return [
      { label: '계정 생성 완료', to: 'COMPLETED', variant: 'primary', needsNote: true },
      { label: '컴플라이언스 반려', to: 'COMPLIANCE_REVIEW_REQUIRED', variant: 'outline', needsNote: true },
      { label: '케이스 종료', to: 'CLOSED', closeReason: 'DROPPED', variant: 'danger', needsNote: true },
    ]
  }
  return []
}

// ── main component ────────────────────────────────────────────────────────────

type TabKey = 'info' | 'docs' | 'history'

export default function InternalCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const updateCase = useCaseStore((s) => s.updateCase)
  const { getNotes, addNote } = useInternalNoteStore()

  const [tab, setTab] = useState<TabKey>('info')
  const [pendingAction, setPendingAction] = useState<ActionDef | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [docRevisionId, setDocRevisionId] = useState<string | null>(null)
  const [docRevisionNote, setDocRevisionNote] = useState('')

  if (!c || !id || !session) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
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

  // ── document handlers ──
  function approveDoc(docId: string) {
    updateCase(caseId, {
      documents: caseObj.documents.map((d) =>
        d.id === docId ? { ...d, status: 'APPROVED' as DocumentStatus } : d
      ),
    })
  }

  function requestDocRevision(docId: string) {
    if (!docRevisionNote.trim()) return
    updateCase(caseId, {
      documents: caseObj.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'REVISION_REQUIRED' as DocumentStatus,
              revisionHistory: [
                ...d.revisionHistory,
                {
                  documentId: docId,
                  timestamp: Date.now(),
                  requiredBy: sess.name,
                  reason: docRevisionNote,
                },
              ],
            }
          : d
      ),
    })
    setDocRevisionId(null)
    setDocRevisionNote('')
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
      setPendingAction(null)
      setActionNote('')
      navigate('/internal/dashboard')
    }
  }

  // ── chat handler ──
  function sendMessage() {
    if (!chatInput.trim()) return
    const msg: Message = {
      id: `msg_${Date.now()}`,
      caseId,
      sender: { role, name: sess.name },
      text: chatInput.trim(),
      sentAt: Date.now(),
    }
    updateCase(caseId, { messages: [...caseObj.messages, msg] })
    setChatInput('')
  }

  // ── note handler ──
  function sendNote() {
    if (!noteInput.trim()) return
    addNote(caseId, { role, name: sess.name }, noteInput.trim())
    setNoteInput('')
  }

  // ── render ──
  const SEGMENT_LABEL: Record<string, string> = {
    'SentBiz Corporate': '법인',
    'SentBiz Individual': '개인사업자',
    'FI': 'FI',
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-sb-n100 sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/internal/dashboard')}
            className="flex items-center gap-1.5 text-[13px] text-sb-n500 hover:text-sb-n800 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
            대시보드
          </button>
          <div className="h-4 w-px bg-sb-n200" />
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[15px] font-semibold text-sb-n900 truncate">
              {c.customerName || c.customerEmail}
            </span>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[c.status]}`}>
              {STATUS_LABELS[c.status]}
            </span>
            <span className="text-[12px] text-sb-n400 flex-shrink-0">
              {SEGMENT_LABEL[c.segmentInfo.entitySegment] ?? c.segmentInfo.entitySegment}
              {c.segmentInfo.serviceSegments.length > 0 && ` · ${c.segmentInfo.serviceSegments.join(' · ')}`}
            </span>
          </div>
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
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-sb-brand text-sb-brand'
                  : 'border-transparent text-sb-n500 hover:text-sb-n800'
              }`}
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
            <div className="bg-white rounded-[12px] border border-sb-n100 p-6 flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-sb-n900">1차 입력 정보</h3>
              {Object.keys(c.firstIntake.data).length > 0 ? (
                <IntakeDataDisplay data={c.firstIntake.data} />
              ) : (
                <p className="text-[13px] text-sb-n400">입력 데이터가 없습니다.</p>
              )}
            </div>

            {c.secondIntake.status !== 'not_started' && (
              <div className="bg-white rounded-[12px] border border-sb-n100 p-6 flex flex-col gap-4">
                <h3 className="text-[14px] font-semibold text-sb-n900">2차 입력 정보</h3>
                {Object.keys(c.secondIntake.data).length > 0 ? (
                  <IntakeDataDisplay data={c.secondIntake.data} />
                ) : (
                  <p className="text-[13px] text-sb-n400">입력 데이터가 없습니다.</p>
                )}
              </div>
            )}

            <div className="bg-white rounded-[12px] border border-sb-n100 p-6 flex flex-col gap-3">
              <h3 className="text-[14px] font-semibold text-sb-n900">세그먼트 판단</h3>
              <div className="grid grid-cols-[180px_1fr] gap-2">
                <span className="text-[12px] text-sb-n500">Entity</span>
                <span className="text-[13px] text-sb-n800">{c.segmentInfo.entitySegment}</span>
                <span className="text-[12px] text-sb-n500">Service</span>
                <span className="text-[13px] text-sb-n800">{c.segmentInfo.serviceSegments.join(', ') || '—'}</span>
                <span className="text-[12px] text-sb-n500">설립 국가</span>
                <span className="text-[13px] text-sb-n800">{c.segmentInfo.foundingCountry || '—'}</span>
                <span className="text-[12px] text-sb-n500">월간 거래 규모</span>
                <span className="text-[13px] text-sb-n800">
                  {c.segmentInfo.monthlyVolume ? `${c.segmentInfo.monthlyVolume} ${c.segmentInfo.monthlyVolumeCurrency}` : '—'}
                </span>
                <span className="text-[12px] text-sb-n500">리스크</span>
                <span className="text-[13px] text-sb-n800">{c.segmentInfo.complianceRisk}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 서류 탭 ── */}
        {tab === 'docs' && (
          <div className="flex flex-col gap-4 max-w-[800px]">
            {c.documents.length === 0 ? (
              <div className="bg-white rounded-[12px] border border-sb-n100 p-12 flex flex-col items-center gap-3 text-center">
                <FileDashed size={36} className="text-sb-n300" />
                <p className="text-[14px] text-sb-n400">서류 목록이 없습니다.</p>
              </div>
            ) : (
              c.documents.map((doc) => {
                const badge = DOC_STATUS_BADGE[doc.status]
                const isRevisionOpen = docRevisionId === doc.id
                return (
                  <div key={doc.id} className="bg-white rounded-[12px] border border-sb-n100 p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText size={18} className="text-sb-n400 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[14px] font-medium text-sb-n900">{doc.displayName}</span>
                          {doc.uploadedFiles.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {doc.uploadedFiles.map((f) => (
                                <span key={f.id} className="text-[12px] text-sb-n500">{f.fileName}</span>
                              ))}
                            </div>
                          )}
                          {doc.revisionHistory.length > 0 && (
                            <span className="text-[12px] text-orange-500">
                              보완 사유: {doc.revisionHistory[doc.revisionHistory.length - 1].reason}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {role === 'COMPLIANCE' && doc.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => approveDoc(doc.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-sb-positive-light text-sb-positive hover:opacity-80 transition-opacity"
                            >
                              <Check size={13} weight="bold" />
                              승인
                            </button>
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
                          </>
                        )}
                      </div>
                    </div>

                    {isRevisionOpen && (
                      <div className="flex gap-2 pt-1 border-t border-sb-n100">
                        <input
                          className="flex-1 border border-sb-n200 rounded-[8px] px-3 py-2 text-[13px] text-sb-n800 placeholder:text-sb-n400 focus:outline-none focus:border-sb-brand"
                          placeholder="보완 요청 사유를 입력하세요"
                          value={docRevisionNote}
                          onChange={(e) => setDocRevisionNote(e.target.value)}
                        />
                        <button
                          onClick={() => requestDocRevision(doc.id)}
                          className="px-3 py-2 rounded-[8px] text-[12px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                          전송
                        </button>
                        <button
                          onClick={() => { setDocRevisionId(null); setDocRevisionNote('') }}
                          className="px-3 py-2 rounded-[8px] text-[12px] text-sb-n500 hover:text-sb-n800 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── 이력 탭 ── */}
        {tab === 'history' && (
          <div className="grid grid-cols-[1fr_360px] gap-6 max-w-[1100px]">
            {/* Left: timeline */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-[12px] border border-sb-n100 p-6">
                <h3 className="text-[14px] font-semibold text-sb-n900 mb-4">상태 변경 이력</h3>
                <div className="flex flex-col gap-0">
                  {c.statusHistory.map((h, i) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i === 0 ? 'bg-sb-brand' : 'bg-sb-n100'
                        }`}>
                          {i === 0
                            ? <CheckCircle size={14} weight="fill" className="text-white" />
                            : <Clock size={14} className="text-sb-n400" />
                          }
                        </div>
                        {i < c.statusHistory.length - 1 && (
                          <div className="w-px flex-1 min-h-[20px] bg-sb-n100 my-1" />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-[13px] font-medium text-sb-n800">
                          {STATUS_LABELS[h.newStatus as CaseStatus] ?? h.newStatus}
                        </p>
                        <p className="text-[11px] text-sb-n400">
                          {formatDate(h.changedAt)} · {h.changedBy.name}
                        </p>
                        {h.notes && (
                          <p className="text-[12px] text-sb-n600 mt-0.5 bg-sb-n50 rounded-[6px] px-2 py-1">{h.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: chat + notes */}
            <div className="flex flex-col gap-4">
              {/* Customer chat */}
              <div className="bg-white rounded-[12px] border border-sb-n100 p-5 flex flex-col gap-3">
                <h3 className="text-[13px] font-semibold text-sb-n900 flex items-center gap-1.5">
                  <ChatCircle size={15} />
                  고객 채팅
                </h3>
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                  {c.messages.length === 0 ? (
                    <p className="text-[12px] text-sb-n400 text-center py-4">메시지가 없습니다.</p>
                  ) : (
                    c.messages.map((msg) => {
                      const isMe = msg.sender.role !== 'CUSTOMER'
                      return (
                        <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] text-sb-n400">{msg.sender.name}</span>
                          <div className={`max-w-[240px] rounded-[10px] px-3 py-2 text-[13px] ${
                            isMe ? 'bg-sb-brand text-white' : 'bg-sb-n100 text-sb-n800'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-sb-n400">{formatDate(msg.sentAt)}</span>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="flex gap-2 border-t border-sb-n100 pt-3">
                  <input
                    className="flex-1 border border-sb-n200 rounded-[8px] px-3 py-2 text-[13px] text-sb-n800 placeholder:text-sb-n400 focus:outline-none focus:border-sb-brand text-[12px]"
                    placeholder="고객에게 메시지 전송"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  />
                  <button
                    onClick={sendMessage}
                    className="px-3 py-2 rounded-[8px] bg-sb-brand text-white hover:bg-sb-brand/90 transition-colors flex items-center"
                  >
                    <PaperPlaneTilt size={14} weight="fill" />
                  </button>
                </div>
              </div>

              {/* Internal notes */}
              <div className="bg-white rounded-[12px] border border-sb-n100 p-5 flex flex-col gap-3">
                <h3 className="text-[13px] font-semibold text-sb-n900 flex items-center gap-1.5">
                  <Note size={15} />
                  내부 노트 <span className="text-[11px] font-normal text-sb-n400">(고객 비공개)</span>
                </h3>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-[12px] text-sb-n400 text-center py-4">내부 노트가 없습니다.</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="bg-amber-50 rounded-[8px] px-3 py-2">
                        <p className="text-[12px] text-amber-800">{note.text}</p>
                        <p className="text-[10px] text-amber-500 mt-0.5">{note.author.name} · {formatDate(note.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 border-t border-sb-n100 pt-3">
                  <input
                    className="flex-1 border border-sb-n200 rounded-[8px] px-3 py-2 text-[12px] text-sb-n800 placeholder:text-sb-n400 focus:outline-none focus:border-sb-brand"
                    placeholder="내부 메모 작성"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNote() } }}
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sb-n100 z-20">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-3">
            {pendingAction && (
              <div className="flex gap-2 items-start">
                <div className="flex flex-col gap-1 flex-1">
                  <p className="text-[12px] text-sb-n600 font-medium">
                    {pendingAction.label} — {pendingAction.needsNote ? '사유를 입력하세요 (필수)' : '메모 (선택)'}
                  </p>
                  <textarea
                    className="w-full border border-sb-n200 rounded-[8px] px-3 py-2 text-[13px] text-sb-n800 placeholder:text-sb-n400 focus:outline-none focus:border-sb-brand resize-none"
                    rows={2}
                    placeholder={pendingAction.to === 'COMPLETED' ? '계정 정보 및 안내 사항을 입력하세요' : '사유를 입력하세요'}
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0 pt-5">
                  <button
                    onClick={() => executeAction(pendingAction)}
                    disabled={pendingAction.needsNote && !actionNote.trim()}
                    className="px-4 py-2 rounded-[8px] text-[13px] font-medium bg-sb-brand text-white hover:bg-sb-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    확인
                  </button>
                  <button
                    onClick={() => { setPendingAction(null); setActionNote('') }}
                    className="px-4 py-2 rounded-[8px] text-[13px] text-sb-n500 hover:text-sb-n800 transition-colors"
                  >
                    취소
                  </button>
                </div>
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
                    action.variant === 'primary'
                      ? 'bg-sb-brand text-white hover:bg-sb-brand/90'
                      : action.variant === 'danger'
                      ? 'bg-white text-sb-negative border border-sb-negative hover:bg-red-50'
                      : 'bg-white text-sb-n700 border border-sb-n200 hover:border-sb-n400'
                  } ${pendingAction?.label === action.label ? 'ring-2 ring-offset-1 ring-sb-brand' : ''}`}
                >
                  {action.label}
                </button>
              ))}
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
