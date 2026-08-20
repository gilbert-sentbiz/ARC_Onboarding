import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignOut, Buildings } from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import { useCaseStore } from '../../store/caseStore'
import { STATUS_LABELS, canView } from '../../services/stateMachine'
import type { CaseStatus, UserRole } from '../../types'
import NotificationBell from '../../components/ui/NotificationBell'

const ROLE_DEFAULT_FILTER: Record<string, CaseStatus> = {
  SALES: 'SALES_REVIEW_REQUIRED',
  COMPLIANCE: 'COMPLIANCE_REVIEW_REQUIRED',
  OPS: 'OPS_REVIEW_REQUIRED',
}

const ALL_STATUSES: CaseStatus[] = ['DOCUMENT_SUBMISSION_REQUIRED', 'SALES_REVIEW_REQUIRED', 'COMPLIANCE_REVIEW_REQUIRED', 'REVISION_REQUESTED', 'OPS_REVIEW_REQUIRED', 'COMPLETED', 'CLOSED']

const ROLE_VIEWABLE_STATUSES: Record<string, CaseStatus[]> = {
  SALES: ALL_STATUSES,
  COMPLIANCE: ALL_STATUSES,
  OPS: ALL_STATUSES,
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

const SERVICE_LABEL: Record<string, string> = {
  'SVC_KRW': 'KRW Collection',
  'SVC_VND': 'VND Collection',
  'SVC_ETC': '기타 Collection',
  'SVC_PAYOUT': 'Payout',
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInStatus(c: import('../../types').Case): number {
  const entry = [...c.statusHistory].reverse().find(h => h.newStatus === c.status)
  if (!entry) return 0
  return Math.floor((Date.now() - entry.changedAt) / 86_400_000)
}

const STATUS_BADGE: Record<CaseStatus, { bg: string; text: string }> = {
  INQUIRY_RECEIVED:           { bg: 'bg-sb-n100', text: 'text-sb-n600' },
  DOCUMENT_SUBMISSION_REQUIRED: { bg: 'bg-blue-50', text: 'text-blue-600' },
  SALES_REVIEW_REQUIRED:      { bg: 'bg-amber-50', text: 'text-amber-600' },
  COMPLIANCE_REVIEW_REQUIRED: { bg: 'bg-purple-50', text: 'text-purple-600' },
  REVISION_REQUESTED:         { bg: 'bg-orange-50', text: 'text-orange-600' },
  OPS_REVIEW_REQUIRED:        { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  COMPLETED:                  { bg: 'bg-sb-positive-light', text: 'text-sb-positive' },
  CLOSED:                     { bg: 'bg-sb-n100', text: 'text-sb-n500' },
}

export default function InternalDashboard() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const clearSession = useSessionStore((s) => s.clearSession)
  const casesMap = useCaseStore((s) => s.cases)
  const cases = useMemo(() => Object.values(casesMap), [casesMap])

  const role = session?.role as UserRole
  const defaultFilter = ROLE_DEFAULT_FILTER[role] ?? 'SALES_REVIEW_REQUIRED'
  const [filter, setFilter] = useState<CaseStatus | 'ALL'>(defaultFilter)

  const viewable = ROLE_VIEWABLE_STATUSES[role] ?? []

  const filtered = cases
    .filter((c) => canView(c.status, role))
    .filter((c) => filter === 'ALL' ? true : c.status === filter)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  function handleLogout() {
    clearSession()
    navigate('/internal')
  }

  return (
    <div className="min-h-screen bg-sb-n50">
      {/* Header */}
      <header className="bg-white border-b border-sb-n100 sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/ARK_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-6 w-auto" />
            <nav className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-sb-brand bg-sb-blue-100"
                onClick={() => navigate('/internal/dashboard')}
              >
                대시보드
              </button>
              {role === 'SALES' && (
                <button
                  className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-sb-n500 hover:text-sb-n800 hover:bg-sb-n50 transition-colors"
                  onClick={() => navigate('/internal/crm')}
                >
                  CRM
                </button>
              )}
              {role === 'COMPLIANCE' && (
                <button
                  className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-sb-n500 hover:text-sb-n800 hover:bg-sb-n50 transition-colors"
                  onClick={() => navigate('/internal/rules')}
                >
                  Rule 관리
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-sb-n500">
              <span className="font-medium text-sb-n800">{session?.name}</span>
              {' '}({session?.role === 'SALES' ? '영업' : session?.role === 'COMPLIANCE' ? '컴플라이언스' : '운영'})
            </span>
            <NotificationBell role={role} name={session?.name} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[13px] text-sb-n400 hover:text-sb-n700 transition-colors"
            >
              <SignOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              filter === 'ALL'
                ? 'bg-sb-n900 text-white border-sb-n900'
                : 'bg-white text-sb-n500 border-sb-n200 hover:border-sb-n400'
            }`}
          >
            전체
          </button>
          {viewable.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                filter === s
                  ? 'bg-sb-n900 text-white border-sb-n900'
                  : 'bg-white text-sb-n500 border-sb-n200 hover:border-sb-n400'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Case list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[12px] border border-sb-n100 p-12 flex flex-col items-center gap-3 text-center">
            <Buildings size={36} className="text-sb-n300" />
            <p className="text-[14px] text-sb-n400">해당 조건의 케이스가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[12px] border border-sb-n100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_130px_150px_100px_90px_70px_110px] gap-4 px-5 py-3 bg-sb-n50 border-b border-sb-n100">
              {['회사명', '상태', '세그먼트', '생성일', '최종 수정', '대기', '담당자'].map((h) => (
                <span key={h} className="text-[12px] font-semibold text-sb-n500">{h}</span>
              ))}
            </div>

            {filtered.map((c, i) => {
              const badge = STATUS_BADGE[c.status]
              const rawServices = c.segmentInfo?.services ?? c.segmentInfo?.serviceSegments ?? []
              const services = rawServices.map((s: string) => SERVICE_LABEL[s] ?? s).join(' · ')
              const entitySegment = c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''
              const daysWaiting = getDaysInStatus(c)
              const ownerName = c.currentOwner?.role !== 'CUSTOMER' ? c.currentOwner?.name : '—'
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/internal/case/${c.id}`)}
                  className={`w-full grid grid-cols-[1fr_130px_150px_100px_90px_70px_110px] gap-4 px-5 py-4 text-left hover:bg-sb-n50 transition-colors ${
                    i < filtered.length - 1 ? 'border-b border-sb-n100' : ''
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[14px] font-medium text-sb-n900 truncate">{c.customerName || c.customerEmail}</span>
                    <span className="text-[12px] text-sb-n400 truncate">{c.customerEmail}</span>
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] text-sb-n700">{SEGMENT_LABEL[entitySegment] ?? entitySegment}</span>
                    {services && <span className="text-[11px] text-sb-n400">{services}</span>}
                  </div>
                  <span className="text-[13px] text-sb-n500">{formatDate(c.createdAt)}</span>
                  <span className="text-[13px] text-sb-n500">{formatDate(c.updatedAt)}</span>
                  <span className={`text-[13px] ${daysWaiting >= 3 ? 'text-sb-negative font-medium' : 'text-sb-n500'}`}>
                    {daysWaiting}일
                  </span>
                  <span className="text-[13px] text-sb-n600 truncate">{ownerName}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
