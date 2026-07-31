'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SignOut, Tray, PaperPlaneTilt, CaretDown, CaretUp } from '@phosphor-icons/react'
import { useSessionStore } from '@/store/sessionStore'
import { useCaseStore } from '@/store/caseStore'
import { useSalesActionStore } from '@/store/salesActionStore'
import { STATUS_LABELS } from '@/services/stateMachine'
import type { CaseStatus } from '@/types'

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const CLOSE_REASON_LABEL: Record<string, string> = {
  DROPPED: '내부 판단 종료',
  EXITED: '고객 이탈',
}

const SEGMENT_LABEL: Record<string, string> = {
  // PI-38 codes
  'ENTITY_CORP': '법인',
  'ENTITY_INDIV': '개인사업자',
  'ENTITY_FI': 'FI',
  // Legacy (backward compat)
  'SentBiz Corporate': '법인',
  'SentBiz Individual': '개인사업자',
  'FI': 'FI',
}

export default function InternalCRM() {
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const clearSession = useSessionStore((s) => s.clearSession)
  const casesMap = useCaseStore((s) => s.cases)
  const cases = useMemo(() => Object.values(casesMap), [casesMap])
  const { getActions, addAction } = useSalesActionStore()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionInputs, setActionInputs] = useState<Record<string, string>>({})

  const closedCases = cases
    .filter((c) => c.status === 'CLOSED')
    .sort((a, b) => b.updatedAt - a.updatedAt)

  function handleLogout() {
    clearSession()
    router.push('/internal')
  }

  function submitAction(caseId: string) {
    const text = actionInputs[caseId]?.trim()
    if (!text || !session) return
    addAction(caseId, { name: session.name, email: session.email }, text)
    setActionInputs((prev) => ({ ...prev, [caseId]: '' }))
  }

  // 영업이 아니면 접근 불가
  if (session?.role !== 'SALES') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sb-n50)' }}>
        <div className="text-center">
          <p className="text-[14px] mb-3" style={{ color: 'var(--sb-n500)' }}>CRM은 영업 담당자만 접근할 수 있습니다.</p>
          <button
            onClick={() => router.push('/internal/dashboard')}
            className="text-[13px] hover:underline"
            style={{ color: 'var(--sb-brand)' }}
          >
            대시보드로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--sb-n50)' }}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10" style={{ borderColor: 'var(--sb-n100)' }}>
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-6 w-auto" />
            <nav className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
                style={{ color: 'var(--sb-n500)' }}
                onClick={() => router.push('/internal/dashboard')}
              >
                대시보드
              </button>
              <button
                className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium"
                style={{ color: 'var(--sb-brand)', background: 'var(--sb-blue-100)' }}
              >
                CRM
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px]" style={{ color: 'var(--sb-n500)' }}>
              <span className="font-medium" style={{ color: 'var(--sb-n800)' }}>{session.name}</span>
              {' '}(영업)
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[13px] transition-colors"
              style={{ color: 'var(--sb-n400)' }}
            >
              <SignOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--sb-n900)' }}>종료 케이스 관리</h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--sb-n500)' }}>종료된 케이스에 후속 조치를 기록하고 관리합니다.</p>
        </div>

        {closedCases.length === 0 ? (
          <div className="bg-white rounded-[12px] border p-12 flex flex-col items-center gap-3 text-center" style={{ borderColor: 'var(--sb-n100)' }}>
            <Tray size={36} style={{ color: 'var(--sb-n300)' }} />
            <p className="text-[14px]" style={{ color: 'var(--sb-n400)' }}>종료된 케이스가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {closedCases.map((c) => {
              const isExpanded = expandedId === c.id
              const actions = getActions(c.id)
              const lastAction = actions[actions.length - 1]

              // 종료 직전 상태 찾기
              const lastHistory = [...c.statusHistory].reverse()
              const prevStatus = lastHistory.find((h) => h.previousStatus && h.newStatus === 'CLOSED')
              const beforeClose = prevStatus?.previousStatus as CaseStatus | undefined

              return (
                <div key={c.id} className="bg-white rounded-[12px] border overflow-hidden" style={{ borderColor: 'var(--sb-n100)' }}>
                  {/* List row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="w-full grid grid-cols-[1fr_120px_120px_140px_auto] gap-4 px-5 py-4 text-left transition-colors items-center hover:bg-sb-n50"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[14px] font-medium truncate" style={{ color: 'var(--sb-n900)' }}>{c.customerName || c.customerEmail}</span>
                      <span className="text-[12px] truncate" style={{ color: 'var(--sb-n400)' }}>{c.customerEmail}</span>
                    </div>
                    <span className="text-[13px]" style={{ color: 'var(--sb-n600)' }}>{formatDate(c.updatedAt)}</span>
                    <span className={`text-[12px] font-medium ${
                      c.closeReason === 'DROPPED' ? 'text-amber-600' : 'text-amber-600'
                    }`}
                      style={c.closeReason === 'DROPPED' ? { color: 'var(--sb-negative)' } : undefined}
                    >
                      {c.closeReason ? CLOSE_REASON_LABEL[c.closeReason] : '—'}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px]" style={{ color: 'var(--sb-n600)' }}>{SEGMENT_LABEL[c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''] ?? (c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment)}</span>
                      {beforeClose && (
                        <span className="text-[11px]" style={{ color: 'var(--sb-n400)' }}>{STATUS_LABELS[beforeClose]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {lastAction && (
                        <span className="text-[11px] max-w-[160px] truncate" style={{ color: 'var(--sb-n400)' }}>{lastAction.text}</span>
                      )}
                      {isExpanded ? (
                        <CaretUp size={14} className="flex-shrink-0" style={{ color: 'var(--sb-n400)' }} />
                      ) : (
                        <CaretDown size={14} className="flex-shrink-0" style={{ color: 'var(--sb-n400)' }} />
                      )}
                    </div>
                  </button>

                  {/* Expanded area */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 flex flex-col gap-4" style={{ borderColor: 'var(--sb-n100)' }}>
                      {/* Closed reason detail */}
                      {prevStatus?.notes && (
                        <div className="rounded-[8px] p-3" style={{ background: 'var(--sb-n50)' }}>
                          <p className="text-[11px] mb-1" style={{ color: 'var(--sb-n400)' }}>종료 사유</p>
                          <p className="text-[13px]" style={{ color: 'var(--sb-n700)' }}>{prevStatus.notes}</p>
                        </div>
                      )}

                      {/* Sales actions list */}
                      {actions.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-[12px] font-semibold" style={{ color: 'var(--sb-n600)' }}>영업 액션 기록</p>
                          {actions.map((a) => (
                            <div key={a.id} className="flex items-start gap-2">
                              <span className="text-[11px] flex-shrink-0 pt-0.5" style={{ color: 'var(--sb-n400)' }}>{formatDate(a.createdAt)}</span>
                              <span className="text-[13px]" style={{ color: 'var(--sb-n700)' }}>{a.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add action */}
                      <div className="flex gap-2">
                        <input
                          className="flex-1 border rounded-[8px] px-3 py-2 text-[13px] focus:outline-none"
                          style={{ borderColor: 'var(--sb-n200)', color: 'var(--sb-n800)' }}
                          placeholder="후속 조치 기록 (예: 재연락 예정, 경쟁사 이동 확인)"
                          value={actionInputs[c.id] ?? ''}
                          onChange={(e) => setActionInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitAction(c.id) }}
                        />
                        <button
                          onClick={() => submitAction(c.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-medium text-white transition-colors"
                          style={{ background: 'var(--sb-brand)' }}
                        >
                          <PaperPlaneTilt size={14} weight="fill" />
                          기록
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
