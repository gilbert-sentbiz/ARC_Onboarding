'use client'

import styled from '@emotion/styled'
import { SignOut, Buildings } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { STATUS_LABELS, canView } from '@/src/features/case-state/model/stateMachine'
import { listCases } from '@/src/shared/api/casesApi'
import { colors } from '@/src/shared/const/tokens'
import type { CaseStatus, UserRole, Case } from '@/src/shared/type'
import NotificationBell from '@/src/widgets/notification-bell/ui/NotificationBell'

const ROLE_DEFAULT_FILTER: Record<string, CaseStatus> = {
  SALES: 'SALES_REVIEW_REQUIRED',
  COMPLIANCE: 'COMPLIANCE_REVIEW_REQUIRED',
  OPS: 'OPS_REVIEW_REQUIRED',
}

const ALL_STATUSES: CaseStatus[] = [
  'DOCUMENT_SUBMISSION_REQUIRED',
  'SALES_REVIEW_REQUIRED',
  'COMPLIANCE_REVIEW_REQUIRED',
  'REVISION_REQUESTED',
  'OPS_REVIEW_REQUIRED',
  'COMPLETED',
  'CLOSED',
]

const ROLE_VIEWABLE_STATUSES: Record<string, CaseStatus[]> = {
  SALES: ALL_STATUSES,
  COMPLIANCE: ALL_STATUSES,
  OPS: ALL_STATUSES,
}

const SEGMENT_LABEL: Record<string, string> = {
  ENTITY_CORP: '법인',
  ENTITY_INDIV: '개인사업자',
  ENTITY_FI: 'FI',
  'SentBiz Corporate': '법인',
  'SentBiz Individual': '개인사업자',
  FI: 'FI',
}

const SERVICE_LABEL: Record<string, string> = {
  SVC_KRW: 'KRW Collection',
  SVC_VND: 'VND Collection',
  SVC_ETC: '기타 Collection',
  SVC_PAYOUT: 'Payout',
}

// Status badge colors (converted from Tailwind custom classes)
const STATUS_BADGE: Record<CaseStatus, { bg: string; text: string }> = {
  INQUIRY_RECEIVED: { bg: colors.n100, text: colors.n600 },
  DOCUMENT_SUBMISSION_REQUIRED: { bg: '#eff6ff', text: '#2563eb' },
  SALES_REVIEW_REQUIRED: { bg: '#fffbeb', text: '#d97706' },
  COMPLIANCE_REVIEW_REQUIRED: { bg: '#faf5ff', text: '#9333ea' },
  REVISION_REQUESTED: { bg: '#fff7ed', text: '#ea580c' },
  OPS_REVIEW_REQUIRED: { bg: '#ecfeff', text: '#0e7490' },
  COMPLETED: { bg: colors.positiveLight, text: colors.positive },
  CLOSED: { bg: colors.n100, text: colors.n500 },
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInStatus(c: Case): number {
  const entry = [...c.statusHistory].reverse().find((h) => h.newStatus === c.status)
  if (!entry) return 0
  return Math.floor((Date.now() - entry.changedAt) / 86_400_000)
}

// ── Styled components ─────────────────────────────────────────────────────────

const PageWrap = styled.div`
  min-height: 100vh;
  background: ${colors.n50};
`

const PageHeader = styled.header`
  background: ${colors.white};
  border-bottom: 1px solid ${colors.n100};
  position: sticky;
  top: 0;
  z-index: 10;
`

const HeaderInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`

const HeaderNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
`

const NavBtn = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 120ms;
  background: ${({ active }) => (active ? colors.blue100 : 'none')};
  color: ${({ active }) => (active ? colors.brand : colors.n500)};
  &:hover {
    background: ${({ active }) => (active ? colors.blue100 : colors.n50)};
  }
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const SessionLabel = styled.span`
  font-size: 13px;
  color: ${colors.n500};
`

const SessionName = styled.span`
  font-weight: 500;
  color: ${colors.n800};
`

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${colors.n400};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
  &:hover {
    color: ${colors.n600};
  }
`

const PageBody = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`

const FilterBtn = styled.button<{ active: boolean }>`
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${({ active }) => (active ? colors.n900 : colors.n200)};
  background: ${({ active }) => (active ? colors.n900 : colors.white)};
  color: ${({ active }) => (active ? colors.white : colors.n500)};
  cursor: pointer;
  transition:
    background 120ms,
    border-color 120ms,
    color 120ms;
  &:hover {
    border-color: ${({ active }) => (active ? colors.n900 : colors.n400)};
  }
`

const TableWrap = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  border: 1px solid ${colors.n100};
  overflow: hidden;
`

const TableCols = `1fr 130px 150px 100px 90px 70px 110px`

const TableHead = styled.div`
  display: grid;
  grid-template-columns: ${TableCols};
  gap: 16px;
  padding: 12px 20px;
  background: ${colors.n50};
  border-bottom: 1px solid ${colors.n100};
`

const TableHeadCell = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.n500};
`

const TableRow = styled.button<{ hasBorder: boolean }>`
  display: grid;
  grid-template-columns: ${TableCols};
  gap: 16px;
  padding: 16px 20px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: ${({ hasBorder }) => (hasBorder ? `1px solid ${colors.n100}` : 'none')};
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: ${colors.n50};
  }
`

const CellStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

const CellPrimary = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.n900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CellSecondary = styled.span`
  font-size: 12px;
  color: ${colors.n400};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StatusPill = styled.span<{ bg: string; textColor: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ bg }) => bg};
  color: ${({ textColor }) => textColor};
`

const SegmentLabel = styled.span`
  font-size: 13px;
  color: ${colors.n700};
`

const SegmentService = styled.span`
  font-size: 11px;
  color: ${colors.n400};
`

const CellDate = styled.span`
  font-size: 13px;
  color: ${colors.n500};
`

const CellDays = styled.span<{ urgent: boolean }>`
  font-size: 13px;
  color: ${({ urgent }) => (urgent ? colors.negative : colors.n500)};
  font-weight: ${({ urgent }) => (urgent ? 500 : undefined)};
`

const CellOwner = styled.span`
  font-size: 13px;
  color: ${colors.n600};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const EmptyState = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  border: 1px solid ${colors.n100};
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
`

const EmptyLabel = styled.p`
  font-size: 14px;
  margin: 0;
  color: ${colors.n400};
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function InternalDashboardPage() {
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const clearSession = useSessionStore((s) => s.clearSession)
  const casesMap = useCaseStore((s) => s.cases)
  const addCase = useCaseStore((s) => s.addCase)
  const updateCase = useCaseStore((s) => s.updateCase)
  const cases = useMemo(() => Object.values(casesMap), [casesMap])

  const role = session?.role as UserRole
  const defaultFilter = ROLE_DEFAULT_FILTER[role] ?? 'SALES_REVIEW_REQUIRED'
  const [filter, setFilter] = useState<CaseStatus | 'ALL'>(defaultFilter)

  useEffect(() => {
    if (!session) return
    void listCases(session.userId).then((apiCases) => {
      if (!apiCases) return null
      const current = useCaseStore.getState().cases
      for (const c of apiCases) {
        if (current[c.id]) updateCase(c.id, c)
        else addCase(c)
      }
      return null
    })
  }, [session, addCase, updateCase])

  const viewable = ROLE_VIEWABLE_STATUSES[role] ?? []

  const filtered = cases
    .filter((c) => canView(c.status, role))
    .filter((c) => (filter === 'ALL' ? true : c.status === filter))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  function handleLogout() {
    clearSession()
    router.push('/internal')
  }

  return (
    <PageWrap>
      <PageHeader>
        <HeaderInner>
          <HeaderLeft>
            <img
              src="/ARK_Onboarding/logos/wordmark-navy.svg"
              alt="SentBiz"
              style={{ height: 24, width: 'auto' }}
            />
            <HeaderNav>
              <NavBtn active onClick={() => router.push('/internal/dashboard')}>
                대시보드
              </NavBtn>
              {role === 'SALES' && (
                <NavBtn onClick={() => router.push('/internal/crm')}>CRM</NavBtn>
              )}
              {role === 'COMPLIANCE' && (
                <NavBtn onClick={() => router.push('/internal/rules')}>Rule 관리</NavBtn>
              )}
            </HeaderNav>
          </HeaderLeft>
          <HeaderRight>
            <SessionLabel>
              <SessionName>{session?.name}</SessionName> (
              {session?.role === 'SALES'
                ? '영업'
                : session?.role === 'COMPLIANCE'
                  ? '컴플라이언스'
                  : '운영'}
              )
            </SessionLabel>
            <NotificationBell role={role} name={session?.name} />
            <LogoutBtn onClick={handleLogout}>
              <SignOut size={15} />
              로그아웃
            </LogoutBtn>
          </HeaderRight>
        </HeaderInner>
      </PageHeader>

      <PageBody>
        {/* Filter tabs */}
        <FilterRow>
          <FilterBtn active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
            전체
          </FilterBtn>
          {viewable.map((s) => (
            <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STATUS_LABELS[s]}
            </FilterBtn>
          ))}
        </FilterRow>

        {/* Case list */}
        {filtered.length === 0 ? (
          <EmptyState>
            <Buildings size={36} color={colors.n300} />
            <EmptyLabel>해당 조건의 케이스가 없습니다.</EmptyLabel>
          </EmptyState>
        ) : (
          <TableWrap>
            <TableHead>
              {['회사명', '상태', '세그먼트', '생성일', '최종 수정', '대기', '담당자'].map((h) => (
                <TableHeadCell key={h}>{h}</TableHeadCell>
              ))}
            </TableHead>

            {filtered.map((c, i) => {
              const badge = STATUS_BADGE[c.status]
              const rawServices = c.segmentInfo?.services ?? c.segmentInfo?.serviceSegments ?? []
              const services = rawServices.map((s: string) => SERVICE_LABEL[s] ?? s).join(' · ')
              const entitySegment = c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''
              const daysWaiting = getDaysInStatus(c)
              const ownerName = c.currentOwner?.role !== 'CUSTOMER' ? c.currentOwner?.name : '—'
              return (
                <TableRow
                  key={c.id}
                  hasBorder={i < filtered.length - 1}
                  onClick={() => router.push(`/internal/case?id=${c.id}`)}
                >
                  <CellStack>
                    <CellPrimary>{c.customerName || c.customerEmail}</CellPrimary>
                    <CellSecondary>{c.customerEmail}</CellSecondary>
                  </CellStack>
                  <div>
                    <StatusPill bg={badge.bg} textColor={badge.text}>
                      {STATUS_LABELS[c.status]}
                    </StatusPill>
                  </div>
                  <CellStack>
                    <SegmentLabel>{SEGMENT_LABEL[entitySegment] ?? entitySegment}</SegmentLabel>
                    {services && <SegmentService>{services}</SegmentService>}
                  </CellStack>
                  <CellDate>{formatDate(c.createdAt)}</CellDate>
                  <CellDate>{formatDate(c.updatedAt)}</CellDate>
                  <CellDays urgent={daysWaiting >= 3}>{daysWaiting}일</CellDays>
                  <CellOwner>{ownerName}</CellOwner>
                </TableRow>
              )
            })}
          </TableWrap>
        )}
      </PageBody>
    </PageWrap>
  )
}
