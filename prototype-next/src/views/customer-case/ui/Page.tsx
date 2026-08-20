'use client'

import styled from '@emotion/styled'
import {
  CheckCircle,
  Circle,
  ClockCounterClockwise,
  ChatCircle,
  PaperPlaneRight,
  ArrowRight,
  CheckFat,
  XCircle,
  WarningCircle,
} from '@phosphor-icons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useRef, useEffect } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { STATUS_LABELS } from '@/src/features/case-state/model/stateMachine'
import { colors } from '@/src/shared/const/tokens'
import type { CaseStatus, Message } from '@/src/shared/type'
import TabBar from '@/src/widgets/customer/tab-bar/ui/TabBar'

// Amber and green palette for status colors (not in design tokens)
const amber50 = '#fffbeb'
const amber100 = '#fef3c7'
const amber300 = '#fcd34d'
const amber500 = '#f59e0b'
const amber600 = '#d97706'
const amber700 = '#b45309'
const green100 = '#dcfce7'
const green600 = '#16a34a'
const green700 = '#15803d'

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

type StatusBannerEntry = { title: string; desc: string; colorClass: string }

const STATUS_BANNER: Partial<Record<CaseStatus, StatusBannerEntry>> = {
  SALES_REVIEW_REQUIRED: {
    title: '영업팀에서 검토 중입니다',
    desc: '서류가 접수되어 영업팀에서 검토를 진행하고 있습니다. 일반적으로 영업일 2–3일 내 결과를 안내드립니다.',
    colorClass: '',
  },
  COMPLIANCE_REVIEW_REQUIRED: {
    title: '컴플라이언스 검토 중입니다',
    desc: '영업 검토가 완료되어 컴플라이언스팀에서 서류를 정밀 검토하고 있습니다. 추가 서류 요청이 있을 수 있습니다.',
    colorClass: '',
  },
  OPS_REVIEW_REQUIRED: {
    title: '계정 생성을 진행하고 있습니다',
    desc: '컴플라이언스 검토가 완료되었습니다. 운영팀에서 계정 생성을 진행 중이며 곧 계정 정보를 안내드립니다.',
    colorClass: '',
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

function milestoneState(ms: CaseStatus, effective: CaseStatus): 'done' | 'active' | 'pending' {
  const mIdx = MS_STATUSES.indexOf(ms)
  const cIdx = MS_STATUSES.indexOf(effective)
  if (cIdx === -1) return 'pending'
  if (cIdx > mIdx) return 'done'
  if (cIdx === mIdx) return 'active'
  return 'pending'
}

// REVISION_REQUESTED는 COMPLIANCE 단계에 표시
// CLOSED는 이전 상태 기준으로 계산
function effectiveStatus(c: import('@/src/shared/type').Case): CaseStatus {
  if (c.status === 'REVISION_REQUESTED') return 'COMPLIANCE_REVIEW_REQUIRED'
  if (c.status === 'CLOSED') {
    const closeEntry = [...c.statusHistory].reverse().find((h) => h.newStatus === 'CLOSED')
    const prev = closeEntry?.previousStatus
    if (
      prev &&
      prev !== 'NOT_REQUESTED' &&
      prev !== 'REQUESTED' &&
      prev !== 'SUBMITTED' &&
      prev !== 'REVISION_REQUIRED' &&
      prev !== 'APPROVED'
    ) {
      return prev as CaseStatus
    }
    return 'INQUIRY_RECEIVED'
  }
  return c.status
}

// ── Styled components ─────────────────────────────────────────────────────────

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

const SectionCard = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-200);
`

const SectionCardOverflow = styled(SectionCard)`
  overflow: hidden;
  padding: 0;
`

// Header card
const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const CaseTag = styled.p`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0 0 4px;
  color: ${colors.brand};
`

const CustomerName = styled.h2`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  margin: 0;
  color: ${colors.n900};
`

const CustomerEmail = styled.p`
  font-size: 13px;
  margin: 2px 0 0;
  color: ${colors.n500};
`

type StatusBadgeVariant = 'completed' | 'revision' | 'closed' | 'normal'

const StatusBadge = styled.span<{ variant: StatusBadgeVariant }>`
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ variant }) =>
    variant === 'completed'
      ? green100
      : variant === 'revision'
        ? amber100
        : variant === 'closed'
          ? colors.n100
          : colors.blue100};
  color: ${({ variant }) =>
    variant === 'completed'
      ? green700
      : variant === 'revision'
        ? amber700
        : variant === 'closed'
          ? colors.n500
          : colors.brand};
`

// Timeline
const TimelineTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 20px;
  color: ${colors.n700};
`

const MilestoneRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

const MilestoneIconCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

type MSState = 'done' | 'active' | 'pending'

const ActiveCircle = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  border: 2px solid ${colors.brand};
  background: ${colors.blue100};
  flex-shrink: 0;
`

const MilestoneConnector = styled.div<{ done: boolean }>`
  width: 1px;
  height: 32px;
  margin-top: 2px;
  background: ${({ done }) => (done ? colors.brand : colors.n200)};
`

const MilestoneContent = styled.div`
  padding-bottom: 4px;
  padding-top: 2px;
  flex: 1;
  min-width: 0;
`

const MilestoneLabel = styled.p<{ state: MSState }>`
  font-size: 14px;
  line-height: 20px;
  margin: 0;
  color: ${({ state }) =>
    state === 'done' ? colors.n800 : state === 'active' ? colors.brand : colors.n400};
  font-weight: ${({ state }) => (state === 'done' ? 500 : state === 'active' ? 600 : undefined)};
`

const MilestoneTime = styled.p`
  font-size: 11px;
  margin: 2px 0 0;
  color: ${colors.n400};
`

const MilestoneRevisionLabel = styled.p`
  font-size: 11px;
  margin: 2px 0 0;
  color: ${amber600};
`

const ClosedMarkerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
`

const ClosedLabel = styled.p`
  font-size: 14px;
  margin: 0;
  color: ${colors.n500};
`

// Status banner
const StatusBannerWrap = styled.div`
  border-radius: 12px;
  border: 1px solid ${colors.brand};
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: ${colors.blue100};
`

const BannerIconWrap = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
`

const BannerTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px;
  color: ${colors.brand};
`

const BannerDesc = styled.p`
  font-size: 13px;
  margin: 0;
  color: ${colors.n700};
`

// Revision banner
const RevisionBannerWrap = styled.div`
  border-radius: 12px;
  border: 1px solid ${amber300};
  background: ${amber50};
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

const RevisionIconWrap = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
  color: ${amber500};
`

const RevisionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`

const RevisionTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px;
  color: ${amber700};
`

const RevisionDesc = styled.p`
  font-size: 13px;
  margin: 0;
  color: ${colors.n700};
`

const RevisionBtn = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${amber500};
  color: ${colors.white};
  border: none;
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: ${amber600};
  }
`

// Completed / Closed card
const CompletedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const CompletedTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: ${colors.n900};
`

const CompletedDesc = styled.p`
  font-size: 13px;
  line-height: 20px;
  margin: 0;
  color: ${colors.n600};
`

const CloseReasonBox = styled.div`
  padding: 16px;
  border-radius: 10px;
  border: 1px solid ${colors.n200};
  background: ${colors.n50};
`

const CloseReasonLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
  color: ${colors.n400};
`

const CloseReasonText = styled.p`
  font-size: 13px;
  line-height: 20px;
  margin: 0;
  color: ${colors.n700};
`

const OutlineBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid ${colors.n200};
  font-size: 14px;
  font-weight: 500;
  color: ${colors.n700};
  background: none;
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: ${colors.n50};
  }
`

// History
const HistoryTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 16px;
  color: ${colors.n700};
`

const HistoryEmpty = styled.p`
  font-size: 13px;
  margin: 0;
  color: ${colors.n400};
`

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const HistoryRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const HistoryText = styled.p`
  font-size: 13px;
  line-height: 18px;
  margin: 0;
  color: ${colors.n800};
`

const HistoryNotes = styled.p`
  font-size: 11px;
  margin: 2px 0 0;
  color: ${colors.n400};
`

const HistoryTime = styled.p`
  font-size: 11px;
  flex-shrink: 0;
  margin: 2px 0 0;
  color: ${colors.n400};
`

// Messages
const MsgHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.n100};
`

const MsgHeaderTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: ${colors.n700};
`

const MsgList = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
`

const MsgEmpty = styled.p`
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
  margin: 0;
  color: ${colors.n400};
`

const MsgRow = styled.div<{ isMe: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: ${({ isMe }) => (isMe ? 'flex-end' : 'flex-start')};
`

const MsgMeta = styled.p`
  font-size: 11px;
  padding: 0 4px;
  margin: 0;
  color: ${colors.n400};
`

const MsgBubble = styled.div<{ isMe: boolean }>`
  max-width: 78%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 20px;
  word-break: break-word;
  border-radius: ${({ isMe }) => (isMe ? '12px 4px 12px 12px' : '4px 12px 12px 12px')};
  background: ${({ isMe }) => (isMe ? colors.brand : colors.n100)};
  color: ${({ isMe }) => (isMe ? colors.white : colors.n800)};
`

const MsgInputRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid ${colors.n100};
`

const MsgTextarea = styled.textarea`
  flex: 1;
  resize: none;
  border-radius: 10px;
  border: 1px solid ${colors.n200};
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  background: ${colors.n50};
  color: ${colors.n800};
  transition: border-color 120ms;
  font-family: inherit;
  &:focus {
    border-color: ${colors.brand};
  }
`

const SendBtn = styled.button`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  align-self: flex-end;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.brand};
  color: ${colors.white};
  cursor: pointer;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
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
      <PageWrap style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: colors.n500 }}>케이스를 찾을 수 없습니다.</p>
      </PageWrap>
    )
  }

  const isCompleted = c.status === 'COMPLETED'
  const isClosed = c.status === 'CLOSED'
  const isRevision = c.status === 'REVISION_REQUESTED'
  const eff = effectiveStatus(c)
  const banner = STATUS_BANNER[c.status]

  const statusVariant: StatusBadgeVariant = isCompleted
    ? 'completed'
    : isRevision
      ? 'revision'
      : isClosed
        ? 'closed'
        : 'normal'

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
    <PageWrap>
      <TabBar caseId={id} active="status" />
      <PageBody>
        <Inner>
          {/* ── 헤더 ── */}
          <SectionCard>
            <HeaderRow>
              <div>
                <CaseTag>케이스 #{c.id.slice(-6).toUpperCase()}</CaseTag>
                <CustomerName>{c.customerName}</CustomerName>
                <CustomerEmail>{c.customerEmail}</CustomerEmail>
              </div>
              <StatusBadge variant={statusVariant}>{STATUS_LABELS[c.status]}</StatusBadge>
            </HeaderRow>
          </SectionCard>

          {/* ── 진행 타임라인 ── */}
          <SectionCard>
            <TimelineTitle>진행 현황</TimelineTitle>
            <div>
              {MILESTONES.map((m, i) => {
                const state = milestoneState(m.status, eff)
                const histEntry = sortedHistory.find((h) => h.newStatus === m.status)
                const isLast = i === MILESTONES.length - 1
                return (
                  <MilestoneRow key={m.status}>
                    <MilestoneIconCol>
                      {state === 'done' ? (
                        <CheckCircle size={20} weight="fill" color={colors.brand} />
                      ) : state === 'active' ? (
                        <ActiveCircle />
                      ) : (
                        <Circle size={20} color={colors.n300} />
                      )}
                      {!isLast && <MilestoneConnector done={state === 'done'} />}
                    </MilestoneIconCol>
                    <MilestoneContent>
                      <MilestoneLabel state={state}>{m.label}</MilestoneLabel>
                      {histEntry && (
                        <MilestoneTime>{fmtDatetime(histEntry.changedAt)}</MilestoneTime>
                      )}
                      {state === 'active' &&
                        isRevision &&
                        m.status === 'COMPLIANCE_REVIEW_REQUIRED' && (
                          <MilestoneRevisionLabel>서류 보완 요청 중</MilestoneRevisionLabel>
                        )}
                    </MilestoneContent>
                  </MilestoneRow>
                )
              })}

              {/* CLOSED 종료 마커 */}
              {isClosed && (
                <ClosedMarkerRow>
                  <XCircle size={20} weight="fill" color={colors.n400} />
                  <ClosedLabel>종료됨</ClosedLabel>
                </ClosedMarkerRow>
              )}
            </div>
          </SectionCard>

          {/* ── 상태별 안내 배너 ── */}
          {banner && (
            <StatusBannerWrap>
              <BannerIconWrap>
                <ClockCounterClockwise size={20} weight="fill" color={colors.brand} />
              </BannerIconWrap>
              <div>
                <BannerTitle>{banner.title}</BannerTitle>
                <BannerDesc>{banner.desc}</BannerDesc>
              </div>
            </StatusBannerWrap>
          )}

          {/* ── 서류 보완 요청 배너 ── */}
          {isRevision && (
            <RevisionBannerWrap>
              <RevisionIconWrap>
                <WarningCircle size={20} weight="fill" />
              </RevisionIconWrap>
              <RevisionContent>
                <div>
                  <RevisionTitle>서류 보완이 필요합니다</RevisionTitle>
                  <RevisionDesc>
                    컴플라이언스 검토 결과 일부 서류의 보완이 요청되었습니다. 서류 업로드 화면에서
                    보완 사유를 확인하고 재제출해주세요.
                  </RevisionDesc>
                </div>
                <RevisionBtn
                  type="button"
                  onClick={() => router.push(`/customer/case/documents?id=${id}`)}
                >
                  서류 보완하러 가기
                  <ArrowRight size={15} />
                </RevisionBtn>
              </RevisionContent>
            </RevisionBannerWrap>
          )}

          {/* ── COMPLETED 카드 ── */}
          {isCompleted && (
            <SectionCard style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CompletedRow>
                <CheckFat size={22} weight="fill" color={green600} />
                <CompletedTitle>온보딩이 완료되었습니다</CompletedTitle>
              </CompletedRow>
              <CompletedDesc>
                계정 생성이 완료되었습니다. 담당자가 별도 채널을 통해 계정 정보를 안내드릴
                예정입니다.
              </CompletedDesc>
              <OutlineBtn type="button" onClick={() => router.push('/')}>
                새 케이스 시작하기
                <ArrowRight size={16} />
              </OutlineBtn>
            </SectionCard>
          )}

          {/* ── CLOSED 카드 ── */}
          {isClosed && (
            <SectionCard style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CompletedRow>
                <XCircle size={22} weight="fill" color={colors.n400} />
                <CompletedTitle>온보딩이 종료되었습니다</CompletedTitle>
              </CompletedRow>
              <CloseReasonBox>
                <CloseReasonLabel>종료 사유</CloseReasonLabel>
                <CloseReasonText>
                  {c.closeReason
                    ? (CLOSE_REASON_DESC[c.closeReason] ?? '종료 처리되었습니다.')
                    : '종료 처리되었습니다.'}
                </CloseReasonText>
              </CloseReasonBox>
              <OutlineBtn type="button" onClick={() => router.push('/')}>
                새 케이스 시작하기
                <ArrowRight size={16} />
              </OutlineBtn>
            </SectionCard>
          )}

          {/* ── 변경 이력 ── */}
          <SectionCard>
            <HistoryTitle>변경 이력</HistoryTitle>
            {sortedHistory.length === 0 ? (
              <HistoryEmpty>이력이 없습니다.</HistoryEmpty>
            ) : (
              <HistoryList>
                {sortedHistory.map((h) => (
                  <HistoryRow key={h.id}>
                    <div style={{ minWidth: 0 }}>
                      <HistoryText>
                        {h.previousStatus
                          ? `${STATUS_LABELS[h.previousStatus as CaseStatus] ?? h.previousStatus} → ${STATUS_LABELS[h.newStatus as CaseStatus] ?? h.newStatus}`
                          : `케이스 생성 · ${STATUS_LABELS[h.newStatus as CaseStatus] ?? h.newStatus}`}
                      </HistoryText>
                      {h.notes && <HistoryNotes>{h.notes}</HistoryNotes>}
                    </div>
                    <HistoryTime>{fmtDatetime(h.changedAt)}</HistoryTime>
                  </HistoryRow>
                ))}
              </HistoryList>
            )}
          </SectionCard>

          {/* ── 메시지 ── */}
          <SectionCardOverflow>
            <MsgHeader>
              <ChatCircle size={17} weight="fill" color={colors.brand} />
              <MsgHeaderTitle>담당자와 메시지</MsgHeaderTitle>
            </MsgHeader>

            <MsgList>
              {sortedMessages.length === 0 ? (
                <MsgEmpty>담당자에게 궁금한 사항이 있으면 메시지를 남겨주세요.</MsgEmpty>
              ) : (
                sortedMessages.map((msg) => {
                  const isMe = msg.sender.role === 'CUSTOMER'
                  return (
                    <MsgRow key={msg.id} isMe={isMe}>
                      <MsgMeta>
                        {isMe ? fmtTime(msg.sentAt) : `${msg.sender.name} · ${fmtTime(msg.sentAt)}`}
                      </MsgMeta>
                      <MsgBubble isMe={isMe}>{msg.text}</MsgBubble>
                    </MsgRow>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </MsgList>

            <MsgInputRow>
              <MsgTextarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
                rows={2}
              />
              <SendBtn type="button" onClick={sendMessage} disabled={!msgText.trim()}>
                <PaperPlaneRight size={17} weight="fill" />
              </SendBtn>
            </MsgInputRow>
          </SectionCardOverflow>
        </Inner>
      </PageBody>
    </PageWrap>
  )
}

export default function CustomerCasePage() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  )
}
