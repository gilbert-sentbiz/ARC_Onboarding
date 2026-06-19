import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Circle,
  ClockCounterClockwise,
  ChatCircle,
  PaperPlaneRight,
  ArrowRight,
  CheckFat,
  XCircle,
} from '@phosphor-icons/react'
import { useCaseStore } from '../../store/caseStore'
import { useSessionStore } from '../../store/sessionStore'
import { STATUS_LABELS } from '../../services/stateMachine'
import type { CaseStatus, Message } from '../../types'
import TabBar from '../../components/customer/TabBar'

// ── 상수 ─────────────────────────────────────────────────────────────────────

const MILESTONES: { status: CaseStatus; label: string }[] = [
  { status: 'INQUIRY_RECEIVED', label: '문의 접수' },
  { status: 'DOCUMENT_SUBMISSION_REQUIRED', label: '서류 제출' },
  { status: 'SALES_REVIEW_REQUIRED', label: '영업 검토' },
  { status: 'COMPLIANCE_REVIEW_REQUIRED', label: '컴플라이언스 검토' },
  { status: 'OPS_REVIEW_REQUIRED', label: '운영 검토' },
  { status: 'COMPLETED', label: '온보딩 완료' },
]
const MS_STATUSES = MILESTONES.map((m) => m.status)

const STATUS_BANNER: Partial<
  Record<CaseStatus, { title: string; desc: string; colorClass: string }>
> = {
  SALES_REVIEW_REQUIRED: {
    title: '영업팀에서 검토 중입니다',
    desc: '서류가 접수되어 영업팀에서 검토를 진행하고 있습니다. 일반적으로 영업일 2–3일 내 결과를 안내드립니다.',
    colorClass: 'bg-sb-blue-100 border-sb-brand',
  },
  COMPLIANCE_REVIEW_REQUIRED: {
    title: '컴플라이언스 검토 중입니다',
    desc: '영업 검토가 완료되어 컴플라이언스팀에서 서류를 정밀 검토하고 있습니다. 추가 서류 요청이 있을 수 있습니다.',
    colorClass: 'bg-sb-blue-100 border-sb-brand',
  },
  OPS_REVIEW_REQUIRED: {
    title: '계정 생성을 진행하고 있습니다',
    desc: '컴플라이언스 검토가 완료되었습니다. 운영팀에서 계정 생성을 진행 중이며 곧 계정 정보를 안내드립니다.',
    colorClass: 'bg-sb-blue-100 border-sb-brand',
  },
}

const CLOSE_REASON_DESC: Record<string, string> = {
  DROPPED: '영업 또는 컴플라이언스 검토 결과 진행이 불가능하다고 판단되었습니다.',
  EXITED: '고객 요청으로 온보딩 프로세스가 종료되었습니다.',
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function fmtDatetime(ts: number) {
  return new Date(ts).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function milestoneState(
  ms: CaseStatus,
  effective: CaseStatus
): 'done' | 'active' | 'pending' {
  const mIdx = MS_STATUSES.indexOf(ms)
  const cIdx = MS_STATUSES.indexOf(effective)
  if (cIdx === -1) return 'pending'
  if (cIdx > mIdx) return 'done'
  if (cIdx === mIdx) return 'active'
  return 'pending'
}

// REVISION_REQUESTED는 COMPLIANCE 단계에 표시
// CLOSED는 이전 상태 기준으로 계산
function effectiveStatus(c: import('../../types').Case): CaseStatus {
  if (c.status === 'REVISION_REQUESTED') return 'COMPLIANCE_REVIEW_REQUIRED'
  if (c.status === 'CLOSED') {
    const closeEntry = [...c.statusHistory].reverse().find((h) => h.newStatus === 'CLOSED')
    const prev = closeEntry?.previousStatus
    if (prev && prev !== 'NOT_REQUESTED' && prev !== 'REQUESTED' && prev !== 'SUBMITTED' && prev !== 'REVISION_REQUIRED' && prev !== 'APPROVED') {
      return prev as CaseStatus
    }
    return 'INQUIRY_RECEIVED'
  }
  return c.status
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function CasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))
  const updateCase = useCaseStore((s) => s.updateCase)

  const [msgText, setMsgText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMsgLen = useRef(0)

  useEffect(() => {
    const len = c?.messages.length ?? 0
    if (len > prevMsgLen.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgLen.current = len
  }, [c?.messages.length])

  if (!c || !id) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const isCompleted = c.status === 'COMPLETED'
  const isClosed = c.status === 'CLOSED'
  const eff = effectiveStatus(c)
  const banner = STATUS_BANNER[c.status]
  const completedNote = isCompleted
    ? [...c.statusHistory].reverse().find((h) => h.newStatus === 'COMPLETED')?.notes
    : undefined

  const sortedHistory = [...c.statusHistory].sort((a, b) => a.changedAt - b.changedAt)
  const sortedMessages = [...c.messages].sort((a, b) => a.sentAt - b.sentAt)

  function sendMessage() {
    const text = msgText.trim()
    if (!text || !session || !id) return
    const now = Date.now()
    const msg: Message = {
      id: `msg_${now}`,
      caseId: id,
      sender: { role: 'CUSTOMER', name: c!.customerName || session.name || '고객' },
      text,
      sentAt: now,
    }
    updateCase(id, { messages: [...c!.messages, msg] })
    setMsgText('')
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col">
      <TabBar caseId={id} active="status" />
      <div className="flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[640px] flex flex-col gap-4">

        {/* ── 헤더 ── */}
        <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: 'var(--shadow-200)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[1px] text-sb-brand uppercase mb-1">
                케이스 #{c.id.slice(-6).toUpperCase()}
              </p>
              <h2 className="text-[20px] font-bold text-sb-n900 leading-[28px]">{c.customerName}</h2>
              <p className="text-[13px] text-sb-n500 mt-0.5">{c.customerEmail}</p>
            </div>
            <span
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : isClosed
                  ? 'bg-sb-n100 text-sb-n500'
                  : c.status === 'REVISION_REQUESTED'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-sb-blue-100 text-sb-brand'
              }`}
            >
              {STATUS_LABELS[c.status]}
            </span>
          </div>
        </div>

        {/* ── 진행 타임라인 ── */}
        <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: 'var(--shadow-200)' }}>
          <p className="text-[13px] font-semibold text-sb-n700 mb-5">진행 현황</p>
          <div className="flex flex-col">
            {MILESTONES.map((m, i) => {
              const state = milestoneState(m.status, eff)
              const histEntry = sortedHistory.find((h) => h.newStatus === m.status)
              const isLast = i === MILESTONES.length - 1
              return (
                <div key={m.status} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {state === 'done' ? (
                      <CheckCircle size={20} weight="fill" className="text-sb-brand flex-shrink-0" />
                    ) : state === 'active' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-sb-brand bg-sb-blue-100 flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-sb-n300 flex-shrink-0" />
                    )}
                    {!isLast && (
                      <div
                        className={`w-px h-8 mt-0.5 ${
                          state === 'done' ? 'bg-sb-brand' : 'bg-sb-n200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-1 flex-1 min-w-0 pt-0.5">
                    <p
                      className={`text-[14px] leading-[20px] ${
                        state === 'done'
                          ? 'font-medium text-sb-n800'
                          : state === 'active'
                          ? 'font-semibold text-sb-brand'
                          : 'text-sb-n400'
                      }`}
                    >
                      {m.label}
                    </p>
                    {histEntry && (
                      <p className="text-[11px] text-sb-n400 mt-0.5">
                        {fmtDatetime(histEntry.changedAt)}
                      </p>
                    )}
                    {state === 'active' && c.status === 'REVISION_REQUESTED' && m.status === 'COMPLIANCE_REVIEW_REQUIRED' && (
                      <p className="text-[11px] text-amber-600 mt-0.5">서류 보완 요청 중</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* CLOSED 종료 마커 */}
            {isClosed && (
              <div className="flex items-center gap-3 mt-1">
                <XCircle size={20} weight="fill" className="text-sb-n400 flex-shrink-0" />
                <p className="text-[14px] text-sb-n500">종료됨</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 상태별 안내 배너 ── */}
        {banner && (
          <div
            className={`rounded-[12px] border p-4 flex items-start gap-3 ${banner.colorClass}`}
          >
            <ClockCounterClockwise
              size={20}
              weight="fill"
              className="text-sb-brand flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-[14px] font-semibold text-sb-brand mb-0.5">{banner.title}</p>
              <p className="text-[13px] text-sb-n700">{banner.desc}</p>
            </div>
          </div>
        )}

        {/* ── COMPLETED 카드 ── */}
        {isCompleted && (
          <div
            className="bg-white rounded-[16px] p-6 flex flex-col gap-4"
            style={{ boxShadow: 'var(--shadow-200)' }}
          >
            <div className="flex items-center gap-3">
              <CheckFat size={22} weight="fill" className="text-green-600" />
              <p className="text-[16px] font-bold text-sb-n900">온보딩이 완료되었습니다</p>
            </div>
            <div className="p-4 bg-sb-n50 rounded-[10px] border border-sb-n200">
              <p className="text-[11px] font-semibold text-sb-n400 uppercase tracking-[0.5px] mb-2">
                계정 안내
              </p>
              <p className="text-[13px] text-sb-n700 leading-[20px] whitespace-pre-wrap">
                {completedNote?.trim()
                  ? completedNote
                  : '센트비 기업 서비스 계정이 생성되었습니다. 로그인 정보는 담당자가 메시지로 별도 안내드립니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-[10px] border border-sb-n200 text-[14px] font-medium text-sb-n700 hover:border-sb-n400 transition-colors"
            >
              새 케이스 시작하기
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── CLOSED 카드 ── */}
        {isClosed && (
          <div
            className="bg-white rounded-[16px] p-6 flex flex-col gap-4"
            style={{ boxShadow: 'var(--shadow-200)' }}
          >
            <div className="flex items-center gap-3">
              <XCircle size={22} weight="fill" className="text-sb-n400" />
              <p className="text-[16px] font-bold text-sb-n900">온보딩이 종료되었습니다</p>
            </div>
            <div className="p-4 bg-sb-n50 rounded-[10px] border border-sb-n200">
              <p className="text-[11px] font-semibold text-sb-n400 uppercase tracking-[0.5px] mb-2">
                종료 사유
              </p>
              <p className="text-[13px] text-sb-n700 leading-[20px]">
                {c.closeReason
                  ? CLOSE_REASON_DESC[c.closeReason] ?? '종료 처리되었습니다.'
                  : '종료 처리되었습니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-[10px] border border-sb-n200 text-[14px] font-medium text-sb-n700 hover:border-sb-n400 transition-colors"
            >
              새 케이스 시작하기
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── 변경 이력 ── */}
        <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: 'var(--shadow-200)' }}>
          <p className="text-[13px] font-semibold text-sb-n700 mb-4">변경 이력</p>
          {sortedHistory.length === 0 ? (
            <p className="text-[13px] text-sb-n400">이력이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedHistory.map((h) => (
                <div key={h.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] text-sb-n800 leading-[18px]">
                      {h.previousStatus
                        ? `${STATUS_LABELS[h.previousStatus as CaseStatus] ?? h.previousStatus} → ${STATUS_LABELS[h.newStatus as CaseStatus] ?? h.newStatus}`
                        : `케이스 생성 · ${STATUS_LABELS[h.newStatus as CaseStatus] ?? h.newStatus}`}
                    </p>
                    {h.notes && (
                      <p className="text-[11px] text-sb-n400 mt-0.5">{h.notes}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-sb-n400 flex-shrink-0 mt-0.5">
                    {fmtDatetime(h.changedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 메시지 ── */}
        <div
          className="bg-white rounded-[16px] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-200)' }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-sb-n100">
            <ChatCircle size={17} weight="fill" className="text-sb-brand" />
            <p className="text-[13px] font-semibold text-sb-n700">담당자와 메시지</p>
          </div>

          {/* 메시지 목록 */}
          <div className="px-4 py-4 flex flex-col gap-3 min-h-[100px] max-h-[300px] overflow-y-auto">
            {sortedMessages.length === 0 ? (
              <p className="text-[13px] text-sb-n400 text-center py-6">
                담당자에게 궁금한 사항이 있으면 메시지를 남겨주세요.
              </p>
            ) : (
              sortedMessages.map((msg) => {
                const isMe = msg.sender.role === 'CUSTOMER'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <p className="text-[11px] text-sb-n400 px-1">
                      {isMe ? fmtTime(msg.sentAt) : `${msg.sender.name} · ${fmtTime(msg.sentAt)}`}
                    </p>
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 text-[14px] leading-[20px] break-words ${
                        isMe
                          ? 'bg-sb-brand text-white rounded-[12px] rounded-tr-[4px]'
                          : 'bg-sb-n100 text-sb-n800 rounded-[12px] rounded-tl-[4px]'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 */}
          <div className="px-4 pb-4 flex gap-2 border-t border-sb-n100 pt-3">
            <textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
              rows={2}
              className="flex-1 resize-none rounded-[10px] border border-sb-n200 bg-sb-n50 px-3 py-2.5 text-[13px] text-sb-n800 placeholder-sb-n400 focus:outline-none focus:border-sb-brand focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!msgText.trim()}
              className="flex-shrink-0 w-10 h-10 self-end rounded-[10px] flex items-center justify-center bg-sb-brand text-white hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <PaperPlaneRight size={17} weight="fill" />
            </button>
          </div>
        </div>

      </div>
      </div>
    </div>
  )
}
