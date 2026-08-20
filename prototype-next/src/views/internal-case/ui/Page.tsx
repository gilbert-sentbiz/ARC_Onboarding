'use client'

import styled from '@emotion/styled'
import {
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  Clock,
  ChatCircle,
  Note,
  PaperPlaneTilt,
  FileText,
  FileDashed,
  Check,
  X,
  CaretDown,
  CaretUp,
  Eye,
  Plus,
  DownloadSimple,
} from '@phosphor-icons/react'
import JSZip from 'jszip'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { useSessionStore } from '@/src/entities/auth/model/sessionStore'
import { useCaseStore } from '@/src/entities/case/model/caseStore'
import { useInternalNoteStore } from '@/src/entities/case/model/internalNoteStore'
import { emitNotification } from '@/src/entities/notification/model/notificationStore'
import { useInternalStaffStore } from '@/src/entities/staff/model/internalStaffStore'
import { transitionStatus, changeOwner } from '@/src/features/case-actions/api/caseService'
import { STATUS_LABELS } from '@/src/features/case-state/model/stateMachine'
import { colors } from '@/src/shared/const/tokens'
import type {
  CaseStatus,
  CloseReason,
  Document,
  DocumentStatus,
  UserRole,
  Message,
  UploadedFile,
} from '@/src/shared/type'
import NotificationBell from '@/src/widgets/notification-bell/ui/NotificationBell'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function downloadFile(file: UploadedFile) {
  if (!file.dataUrl) return
  const a = document.createElement('a')
  a.href = file.dataUrl
  a.download = file.fileName
  a.click()
}

async function downloadAllDocuments(
  docs: Document[],
  companyName: string,
  caseId: string
): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Set<string>()
  for (const doc of docs) {
    const latest =
      doc.uploadedFiles.find((f) => f.isLatest) ?? doc.uploadedFiles[doc.uploadedFiles.length - 1]
    if (!latest?.dataUrl) continue
    const b64Match = latest.dataUrl.match(/^data:[^;]+;base64,(.+)$/)
    if (!b64Match) continue
    const ext = latest.fileName.includes('.') ? latest.fileName.split('.').pop()! : 'bin'
    const base = doc.displayName.replace(/[/\\:*?"<>|]/g, '_')
    let entryName = `${base}.${ext}`
    let counter = 1
    while (usedNames.has(entryName)) entryName = `${base}_${counter++}.${ext}`
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

// ── data constants ────────────────────────────────────────────────────────────

const DOC_STATUS_BADGE: Record<DocumentStatus, { label: string; bg: string; text: string }> = {
  NOT_REQUESTED: { label: '미제출', bg: colors.n100, text: colors.n500 },
  REQUESTED: { label: '제출 요청', bg: '#eff6ff', text: '#2563eb' },
  SUBMITTED: { label: '검토중', bg: '#fffbeb', text: '#d97706' },
  REVISION_REQUIRED: { label: '보완 요청', bg: '#fff7ed', text: '#ea580c' },
  APPROVED: { label: '승인 완료', bg: colors.positiveLight, text: colors.positive },
}

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

const SEGMENT_LABEL: Record<string, string> = {
  ENTITY_CORP: '법인',
  ENTITY_INDIV: '개인사업자',
  ENTITY_FI: 'FI',
  'SentBiz Corporate': '법인',
  'SentBiz Individual': '개인사업자',
  FI: 'FI',
}
const SERVICE_LABEL: Record<string, string> = {
  SVC_COL_KRW: 'KRW Collection',
  SVC_COL_VND: 'VND Collection',
  SVC_COL_ETC: '기타 Collection',
  SVC_PAYOUT: 'Payout',
  SVC_KRW: 'KRW Collection',
  SVC_VND: 'VND Collection',
  SVC_ETC: '기타 Collection',
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
  if (role === 'SALES' && status === 'SALES_REVIEW_REQUIRED') {
    return [
      {
        label: '1차 스크리닝 완료',
        to: 'COMPLIANCE_REVIEW_REQUIRED',
        variant: 'primary',
        needsNote: false,
      },
      {
        label: '반려 (종료)',
        to: 'CLOSED',
        closeReason: 'DROPPED',
        variant: 'danger',
        needsNote: true,
      },
    ]
  }
  if (role === 'COMPLIANCE' && status === 'COMPLIANCE_REVIEW_REQUIRED') {
    return [
      { label: '서류 승인', to: 'OPS_REVIEW_REQUIRED', variant: 'primary', needsNote: false },
      { label: '보완 요청', to: 'REVISION_REQUESTED', variant: 'outline', needsNote: true },
      { label: '영업 반려', to: 'SALES_REVIEW_REQUIRED', variant: 'outline', needsNote: true },
      {
        label: '케이스 종료',
        to: 'CLOSED',
        closeReason: 'DROPPED',
        variant: 'danger',
        needsNote: true,
      },
    ]
  }
  if (role === 'OPS' && status === 'OPS_REVIEW_REQUIRED') {
    return [
      {
        label: '계정 생성',
        to: 'COMPLETED',
        variant: 'primary',
        needsNote: false,
        isConfirmOnly: true,
      },
      {
        label: '컴플라이언스 반려',
        to: 'COMPLIANCE_REVIEW_REQUIRED',
        variant: 'outline',
        needsNote: true,
      },
      {
        label: '케이스 종료',
        to: 'CLOSED',
        closeReason: 'DROPPED',
        variant: 'danger',
        needsNote: true,
      },
    ]
  }
  return []
}

// ── styled components ─────────────────────────────────────────────────────────

const PageWrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  gap: 16px;
`

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 120ms;
  &:hover {
    color: ${colors.n800};
  }
`

const HeaderSep = styled.div`
  width: 1px;
  height: 16px;
  background: ${colors.n200};
  flex-shrink: 0;
`

const HeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  margin-right: 16px;
`

const HeaderTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.n900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const HeaderPill = styled.span<{ bg: string; text: string }>`
  flex-shrink: 0;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ bg }) => bg};
  color: ${({ text }) => text};
`

const HeaderSub = styled.span`
  font-size: 12px;
  color: ${colors.n400};
  flex-shrink: 0;
`

const OwnerArea = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
`

const OwnerKeyLabel = styled.span`
  font-size: 12px;
  color: ${colors.n400};
`

const SelectEl = styled.select`
  font-size: 12px;
  border-radius: 6px;
  padding: 2px 8px;
  border: 1px solid ${colors.n200};
  color: ${colors.n800};
  background: ${colors.white};
  &:focus {
    outline: none;
  }
`

const InlineConfirmBtn = styled.button`
  font-size: 12px;
  color: ${colors.brand};
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const InlineCancelBtn = styled.button`
  font-size: 12px;
  color: ${colors.n400};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
  &:hover {
    color: ${colors.n700};
  }
`

const OwnerName = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.n800};
`

const OwnerChangeLink = styled.button`
  font-size: 11px;
  color: ${colors.brand};
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`

const TabBar = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 4px;
`

const TabBtn = styled.button<{ active: boolean }>`
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? colors.brand : 'transparent')};
  color: ${({ active }) => (active ? colors.brand : colors.n500)};
  background: none;
  cursor: pointer;
  transition:
    color 120ms,
    border-color 120ms;
`

const PageBody = styled.div`
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 24px 144px;
`

// ── info tab ──────────────────────────────────────────────────────────────────

const InfoCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
`

const InfoCard = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  border: 1px solid ${colors.n100};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.n900};
  margin: 0;
`

const EmptyMsg = styled.p`
  font-size: 13px;
  color: ${colors.n400};
  margin: 0;
`

const SegmentGrid = styled.div`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 8px;
`

const SegmentKey = styled.span`
  font-size: 12px;
  color: ${colors.n500};
`

const SegmentVal = styled.span`
  font-size: 13px;
  color: ${colors.n800};
`

// IntakeDataDisplay
const IntakeWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const IntakeNestedKey = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${colors.n400};
  margin: 0 0 4px;
`

const IntakeNestedBlock = styled.div`
  padding-left: 12px;
  border-left: 2px solid ${colors.n100};
`

const IntakeRow = styled.div`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 8px;
  align-items: start;
`

const IntakeRowKey = styled.span`
  font-size: 12px;
  color: ${colors.n500};
`

const IntakeRowVal = styled.span`
  font-size: 13px;
  color: ${colors.n800};
`

// ── docs tab ─────────────────────────────────────────────────────────────────

const DocsCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
`

const EmptyDocsCard = styled.div`
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

const DocActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BulkApproveBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${colors.positiveLight};
  color: ${colors.positive};
  border: none;
  cursor: pointer;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.8;
  }
`

const DocActionsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const OutlineIconBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid ${colors.n200};
  color: ${colors.n700};
  background: ${colors.white};
  cursor: pointer;
  transition: border-color 120ms;
  &:hover {
    border-color: ${colors.n400};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const AdHocFormWrap = styled.div`
  background: #eff6ff;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const AdHocFormTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.n900};
  margin: 0;
`

const AdHocInputsCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FormInput = styled.input`
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${colors.n200};
  color: ${colors.n800};
  background: ${colors.white};
  &:focus {
    outline: none;
  }
`

const FormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const FormSelect = styled.select`
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${colors.n200};
  color: ${colors.n800};
  background: ${colors.white};
  &:focus {
    outline: none;
  }
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${colors.n700};
  cursor: pointer;
  input {
    width: 16px;
    height: 16px;
    accent-color: ${colors.brand};
  }
`

const FormBtns = styled.div`
  display: flex;
  gap: 8px;
`

const SubmitBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.white};
  background: ${colors.brand};
  border: none;
  cursor: pointer;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const TextBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
`

const DocCard = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  border: 1px solid ${colors.n100};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const DocCardTop = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
`

const DocCardLeft = styled.div`
  display: flex;
  align-items: start;
  gap: 12px;
  min-width: 0;
`

const DocMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

const DocName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.n900};
`

const FileHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const FileNameBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${colors.brand};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  &:hover {
    text-decoration: underline;
  }
`

const FileDate = styled.span`
  font-weight: normal;
  color: ${colors.n400};
  margin-left: 4px;
`

const DownloadTextBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: ${colors.n400};
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 120ms;
  &:hover {
    color: ${colors.n700};
  }
`

const OldFilesToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${colors.n400};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 120ms;
  &:hover {
    color: ${colors.n700};
  }
`

const OldFileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
`

const OldFileBtn = styled.button`
  font-size: 11px;
  color: ${colors.n400};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  &:hover {
    text-decoration: underline;
  }
`

const AdHocBadge = styled.span`
  font-size: 12px;
  color: #3b82f6;
`

const RevisionBadge = styled.span`
  font-size: 12px;
  color: #f97316;
`

const DocCardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const DocStatusPill = styled.span<{ bg: string; text: string }>`
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ bg }) => bg};
  color: ${({ text }) => text};
`

const ApproveChip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${colors.positiveLight};
  color: ${colors.positive};
  border: none;
  cursor: pointer;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.8;
  }
`

const RevisionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #fff7ed;
  color: #ea580c;
  border: none;
  cursor: pointer;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.8;
  }
`

const RevisionFormRow = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid ${colors.n100};
`

const RevisionInput = styled.input`
  flex: 1;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${colors.n200};
  color: ${colors.n800};
  &:focus {
    outline: none;
  }
`

const RevisionSendBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: #f97316;
  color: ${colors.white};
  border: none;
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: #ea580c;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const RevisionCancelBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
`

// ── history tab ───────────────────────────────────────────────────────────────

const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  max-width: 1100px;
`

const HistoryLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const HistoryRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TimelineCard = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  border: 1px solid ${colors.n100};
  padding: 24px;
`

const TimelineTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.n900};
  margin: 0 0 16px;
`

const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
`

const TimelineItem = styled.div`
  display: flex;
  gap: 12px;
`

const DotCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Dot = styled.div<{ variant: 'current' | 'owner' | 'past' }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  ${({ variant }) =>
    variant === 'current'
      ? `background: ${colors.brand};`
      : variant === 'owner'
        ? `background: ${colors.n50}; border: 1px solid ${colors.n200};`
        : `background: ${colors.n100};`}
`

const DotLine = styled.div`
  width: 1px;
  flex: 1;
  min-height: 20px;
  margin: 4px 0;
  background: ${colors.n100};
`

const TimelineMeta = styled.div`
  padding-bottom: 16px;
  min-width: 0;
`

const TimelineLabel = styled.p<{ muted: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ muted }) => (muted ? colors.n500 : colors.n800)};
  margin: 0;
`

const TimelineTimestamp = styled.p`
  font-size: 11px;
  color: ${colors.n400};
  margin: 0;
`

const TimelineNoteText = styled.p`
  font-size: 12px;
  margin: 2px 0 0;
  border-radius: 6px;
  padding: 4px 8px;
  color: ${colors.n600};
  background: ${colors.n50};
`

const SideCard = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  border: 1px solid ${colors.n100};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SideCardHeader = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.n900};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`

const ScrollList = styled.div<{ maxHeight: number }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: ${({ maxHeight }) => maxHeight}px;
  overflow-y: auto;
`

const EmptyChatMsg = styled.p`
  font-size: 12px;
  text-align: center;
  padding: 16px 0;
  color: ${colors.n400};
  margin: 0;
`

const MsgItemWrap = styled.div<{ isMe: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: ${({ isMe }) => (isMe ? 'flex-end' : 'flex-start')};
`

const MsgSender = styled.span`
  font-size: 10px;
  color: ${colors.n400};
`

const MsgBubble = styled.div<{ isMe: boolean }>`
  max-width: 240px;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  background: ${({ isMe }) => (isMe ? colors.brand : colors.n100)};
  color: ${({ isMe }) => (isMe ? colors.white : colors.n800)};
`

const MsgTime = styled.span`
  font-size: 10px;
  color: ${colors.n400};
`

const ChatInputRow = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid ${colors.n100};
`

const ChatInputEl = styled.input`
  flex: 1;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${colors.n200};
  color: ${colors.n800};
  &:focus {
    outline: none;
  }
`

const SendIconBtn = styled.button<{ bg?: string }>`
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ bg }) => bg ?? colors.brand};
  color: ${colors.white};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.9;
  }
`

const NoteItem = styled.div`
  background: #fffbeb;
  border-radius: 8px;
  padding: 8px 12px;
`

const NoteText = styled.p`
  font-size: 12px;
  color: #92400e;
  margin: 0;
`

const NoteAuthor = styled.p`
  font-size: 10px;
  color: #f59e0b;
  margin: 2px 0 0;
`

// ── action bar ────────────────────────────────────────────────────────────────

const ActionBarWrap = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${colors.white};
  border-top: 1px solid ${colors.n100};
  z-index: 20;
`

const ActionBarInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PendingRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: start;
`

const ConfirmLabel = styled.p`
  flex: 1;
  font-size: 13px;
  align-self: center;
  color: ${colors.n700};
  margin: 0;
`

const ConfirmBtns = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`

const PrimaryActionBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${colors.white};
  background: ${colors.brand};
  border: none;
  cursor: pointer;
  transition: opacity 120ms;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const TextCancelBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
`

const NoteActionWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`

const NoteActionLabel = styled.p`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.n600};
  margin: 0;
`

const Textarea = styled.textarea`
  width: 100%;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${colors.n200};
  color: ${colors.n800};
  resize: none;
  &:focus {
    outline: none;
  }
`

const NoteActionBtns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  padding-top: 20px;
`

const ActionBtnRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ActionBtnEl = styled.button<{
  variant: 'primary' | 'outline' | 'danger'
  selected: boolean
}>`
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 120ms;
  ${({ variant }) =>
    variant === 'primary'
      ? `background: ${colors.brand}; color: ${colors.white}; border: none;`
      : variant === 'danger'
        ? `background: ${colors.white}; color: ${colors.negative}; border: 1px solid ${colors.negative};`
        : `background: ${colors.white}; color: ${colors.n700}; border: 1px solid ${colors.n200};`}
  ${({ selected, variant }) =>
    selected
      ? `outline: 2px solid ${variant === 'primary' ? colors.brand : variant === 'danger' ? colors.negative : colors.n300}; outline-offset: 2px;`
      : ''}
  &:hover {
    opacity: 0.9;
  }
`

// ── modal ─────────────────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const ModalPanel = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.n100};
`

const ModalFileName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.n900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 16px;
`

const ModalHeaderBtns = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const ModalDownloadBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  color: ${colors.n700};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
  &:hover {
    color: ${colors.n900};
  }
`

const ModalCloseBtn = styled.button`
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
`

const ModalBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`

const PreviewImg = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
`

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 70vh;
  border: 0;
`

const PreviewEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
`

// ── revision banner ───────────────────────────────────────────────────────────

const RevisionBanner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff7ed;
  border-top: 1px solid #fed7aa;
  z-index: 20;
  padding: 12px 24px;
`

const RevisionBannerInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
`

const RevisionBannerText = styled.p`
  font-size: 13px;
  color: #c2410c;
  margin: 0;
`

// ── sub-component ─────────────────────────────────────────────────────────────

function IntakeDataDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <IntakeWrap>
      {Object.entries(data).map(([key, val]) => {
        if (val === null || val === undefined || val === '') return null
        if (typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key}>
              <IntakeNestedKey>{key}</IntakeNestedKey>
              <IntakeNestedBlock>
                <IntakeDataDisplay data={val as Record<string, unknown>} />
              </IntakeNestedBlock>
            </div>
          )
        }
        const display = Array.isArray(val) ? (val as unknown[]).join(', ') : String(val)
        return (
          <IntakeRow key={key}>
            <IntakeRowKey>{key}</IntakeRowKey>
            <IntakeRowVal>{display || '—'}</IntakeRowVal>
          </IntakeRow>
        )
      })}
    </IntakeWrap>
  )
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

  const [tab, setTab] = useState<TabKey>('info')
  const [pendingAction, setPendingAction] = useState<ActionDef | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [docRevisionId, setDocRevisionId] = useState<string | null>(null)
  const [docRevisionNote, setDocRevisionNote] = useState('')
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [expandedDocFiles, setExpandedDocFiles] = useState<Set<string>>(new Set())
  const [ownerChangeMode, setOwnerChangeMode] = useState(false)
  const [selectedNewOwner, setSelectedNewOwner] = useState('')
  const [showAdHocForm, setShowAdHocForm] = useState(false)
  const [adHocForm, setAdHocForm] = useState({
    displayName: '',
    format: '모든 형식',
    isRequired: true,
    reason: '',
  })

  if (!c || !id || !session) {
    return (
      <PageWrap style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: colors.n500 }}>케이스를 찾을 수 없습니다.</p>
      </PageWrap>
    )
  }

  const caseId: string = id
  const caseObj = c
  const sess = session
  const role = sess.role as UserRole
  const actions = getActions(role, caseObj.status)
  const notes = getNotes(caseId)

  function approveDoc(docId: string) {
    updateCase(caseId, {
      documents: caseObj.documents.map((d) =>
        d.id === docId ? { ...d, status: 'APPROVED' as DocumentStatus } : d
      ),
    })
  }

  function approveAllDocs() {
    updateCase(caseId, {
      documents: caseObj.documents.map((d) =>
        d.status === 'SUBMITTED' ? { ...d, status: 'APPROVED' as DocumentStatus } : d
      ),
    })
  }

  function requestDocRevision(docId: string) {
    if (!docRevisionNote.trim()) return
    const now = Date.now()
    const fromStatus = caseObj.status
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
                  timestamp: now,
                  requiredBy: sess.name,
                  reason: docRevisionNote,
                },
              ],
            }
          : d
      ),
      ...(fromStatus !== 'REVISION_REQUESTED' && { revisionRequestedFrom: fromStatus }),
    })
    if (fromStatus !== 'REVISION_REQUESTED') {
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

  function submitAdHocRequest() {
    if (!adHocForm.displayName.trim() || !adHocForm.reason.trim()) return
    const now = Date.now()
    const docId = `adhoc_${now}`
    const reason =
      adHocForm.format !== '모든 형식'
        ? `${adHocForm.reason} (형식: ${adHocForm.format})`
        : adHocForm.reason
    const newDoc: Document = {
      id: docId,
      caseId,
      type: 'adhoc',
      displayName: adHocForm.displayName.trim(),
      status: 'REQUESTED',
      isRequired: adHocForm.isRequired,
      isConditional: false,
      isAdHoc: true,
      requestedBy: sess.name,
      uploadedFiles: [],
      revisionHistory: [{ documentId: docId, timestamp: now, requiredBy: sess.name, reason }],
    }
    const fromStatus = caseObj.status
    updateCase(caseId, {
      documents: [...caseObj.documents, newDoc],
      ...(fromStatus !== 'REVISION_REQUESTED' && { revisionRequestedFrom: fromStatus }),
    })
    if (fromStatus !== 'REVISION_REQUESTED') {
      transitionStatus(caseId, 'REVISION_REQUESTED', { role, name: sess.name })
    } else {
      emitNotification({
        type: 'REVISION_REQUESTED',
        caseId,
        caseLabel: caseObj.customerName || caseObj.customerEmail,
        message: `'${caseObj.customerName || caseObj.customerEmail}' 케이스에 추가 서류가 요청되었습니다.`,
        recipient: { role: 'CUSTOMER', userId: caseObj.customerId },
      })
    }
    setShowAdHocForm(false)
    setAdHocForm({ displayName: '', format: '모든 형식', isRequired: true, reason: '' })
  }

  function toggleDocFilesExpand(docId: string) {
    setExpandedDocFiles((prev) => {
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

  function executeAction(action: ActionDef) {
    if (action.needsNote && !actionNote.trim()) return
    const result = transitionStatus(
      caseId,
      action.to,
      { role, name: sess.name },
      actionNote || undefined
    )
    if (result.ok) {
      if (action.closeReason) updateCase(caseId, { closeReason: action.closeReason })
      setPendingAction(null)
      setActionNote('')
      router.push('/internal/dashboard')
    }
  }

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
    emitNotification({
      type: 'NEW_MESSAGE',
      caseId,
      caseLabel: caseObj.customerName || caseObj.customerEmail,
      message: `'${caseObj.customerName || caseObj.customerEmail}' 케이스에 새 메시지가 도착했습니다.`,
      recipient: { role: 'CUSTOMER', userId: caseObj.customerId },
    })
  }

  function sendNote() {
    if (!noteInput.trim()) return
    addNote(caseId, { role, name: sess.name }, noteInput.trim())
    setNoteInput('')
  }

  const headerBadge = STATUS_BADGE[c.status]

  return (
    <PageWrap>
      {/* Header */}
      <PageHeader>
        <HeaderInner>
          <BackBtn onClick={() => router.push('/internal/dashboard')}>
            <ArrowLeft size={16} />
            대시보드
          </BackBtn>
          <HeaderSep />
          <HeaderMeta>
            <HeaderTitle>{c.customerName || c.customerEmail}</HeaderTitle>
            <HeaderPill bg={headerBadge.bg} text={headerBadge.text}>
              {STATUS_LABELS[c.status]}
            </HeaderPill>
            <HeaderSub>
              {SEGMENT_LABEL[c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''] ??
                c.segmentInfo?.entity ??
                c.segmentInfo?.entitySegment}
              {(() => {
                const svcs = c.segmentInfo?.services ?? c.segmentInfo?.serviceSegments ?? []
                if (svcs.length === 0) return null
                return ` · ${svcs.map((s: string) => SERVICE_LABEL[s] ?? s).join(' · ')}`
              })()}
            </HeaderSub>
            {c.currentOwner?.role !== 'CUSTOMER' && c.currentOwner && (
              <OwnerArea>
                <OwnerKeyLabel>담당자:</OwnerKeyLabel>
                {ownerChangeMode ? (
                  <>
                    <SelectEl
                      value={selectedNewOwner}
                      onChange={(e) => setSelectedNewOwner(e.target.value)}
                    >
                      <option value="">선택</option>
                      {staff
                        .filter((s) => s.role === c.currentOwner?.role)
                        .map((s) => (
                          <option key={s.email} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                    </SelectEl>
                    <InlineConfirmBtn onClick={confirmOwnerChange} disabled={!selectedNewOwner}>
                      확인
                    </InlineConfirmBtn>
                    <InlineCancelBtn
                      onClick={() => {
                        setOwnerChangeMode(false)
                        setSelectedNewOwner('')
                      }}
                    >
                      취소
                    </InlineCancelBtn>
                  </>
                ) : (
                  <>
                    <OwnerName>{c.currentOwner.name}</OwnerName>
                    <OwnerChangeLink onClick={() => setOwnerChangeMode(true)}>변경</OwnerChangeLink>
                  </>
                )}
              </OwnerArea>
            )}
          </HeaderMeta>
          <NotificationBell role={role} name={sess.name} />
        </HeaderInner>

        {/* Tab bar */}
        <TabBar>
          {(
            [
              { key: 'info', label: '고객정보' },
              { key: 'docs', label: '서류' },
              { key: 'history', label: '이력' },
            ] as { key: TabKey; label: string }[]
          ).map((t) => (
            <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </TabBtn>
          ))}
        </TabBar>
      </PageHeader>

      {/* Content */}
      <PageBody>
        {/* ── 고객정보 탭 ── */}
        {tab === 'info' && (
          <InfoCol>
            <InfoCard>
              <CardTitle>1차 입력 정보</CardTitle>
              {Object.keys(c.firstIntake?.data ?? {}).length > 0 ? (
                <IntakeDataDisplay data={c.firstIntake.data} />
              ) : (
                <EmptyMsg>입력 데이터가 없습니다.</EmptyMsg>
              )}
            </InfoCard>

            {c.secondIntake?.status !== 'not_started' && c.secondIntake && (
              <InfoCard>
                <CardTitle>2차 입력 정보</CardTitle>
                {Object.keys(c.secondIntake?.data ?? {}).length > 0 ? (
                  <IntakeDataDisplay data={c.secondIntake.data} />
                ) : (
                  <EmptyMsg>입력 데이터가 없습니다.</EmptyMsg>
                )}
              </InfoCard>
            )}

            <InfoCard>
              <CardTitle>세그먼트 판단</CardTitle>
              <SegmentGrid>
                <SegmentKey>Entity</SegmentKey>
                <SegmentVal>
                  {SEGMENT_LABEL[c.segmentInfo?.entity ?? c.segmentInfo?.entitySegment ?? ''] ??
                    c.segmentInfo?.entity ??
                    c.segmentInfo?.entitySegment ??
                    '—'}
                </SegmentVal>
                <SegmentKey>Service</SegmentKey>
                <SegmentVal>
                  {(c.segmentInfo?.services ?? c.segmentInfo?.serviceSegments ?? [])
                    .map((s: string) => SERVICE_LABEL[s] ?? s)
                    .join(', ') || '—'}
                </SegmentVal>
                {(c.segmentInfo?.sectors?.length ?? 0) > 0 && (
                  <>
                    <SegmentKey>Sector</SegmentKey>
                    <SegmentVal>{c.segmentInfo.sectors.join(', ')}</SegmentVal>
                  </>
                )}
                <SegmentKey>설립 국가</SegmentKey>
                <SegmentVal>{c.segmentInfo?.foundingCountry || '—'}</SegmentVal>
                <SegmentKey>월간 거래 규모</SegmentKey>
                <SegmentVal>
                  {c.segmentInfo?.monthlyVolume
                    ? `${c.segmentInfo.monthlyVolume} ${c.segmentInfo.monthlyVolumeCurrency}`
                    : '—'}
                </SegmentVal>
              </SegmentGrid>
            </InfoCard>
          </InfoCol>
        )}

        {/* ── 서류 탭 ── */}
        {tab === 'docs' && (
          <DocsCol>
            {(c.documents ?? []).length === 0 ? (
              <EmptyDocsCard>
                <FileDashed size={36} color={colors.n300} />
                <EmptyMsg>서류 목록이 없습니다.</EmptyMsg>
              </EmptyDocsCard>
            ) : (
              <>
                <DocActionsBar>
                  {role === 'COMPLIANCE' &&
                  (c.documents ?? []).some((d) => d.status === 'SUBMITTED') ? (
                    <BulkApproveBtn onClick={approveAllDocs}>
                      <Check size={14} weight="bold" />
                      일괄 승인 (
                      {(c.documents ?? []).filter((d) => d.status === 'SUBMITTED').length}건)
                    </BulkApproveBtn>
                  ) : (
                    <div />
                  )}
                  {(role === 'SALES' || role === 'COMPLIANCE' || role === 'OPS') &&
                    (() => {
                      const hasUploads = (c.documents ?? []).some((doc) => {
                        const latest =
                          doc.uploadedFiles.find((f) => f.isLatest) ??
                          doc.uploadedFiles[doc.uploadedFiles.length - 1]
                        return !!latest?.dataUrl
                      })
                      return (
                        <DocActionsRight>
                          <OutlineIconBtn
                            onClick={() =>
                              downloadAllDocuments(c.documents ?? [], c.customerName, c.id)
                            }
                            disabled={!hasUploads}
                            title={!hasUploads ? '업로드된 서류가 없습니다' : undefined}
                          >
                            <DownloadSimple size={14} weight="bold" />
                            일괄 다운로드
                          </OutlineIconBtn>
                          <OutlineIconBtn onClick={() => setShowAdHocForm((v) => !v)}>
                            <Plus size={14} weight="bold" />
                            서류 추가 요청
                          </OutlineIconBtn>
                        </DocActionsRight>
                      )
                    })()}
                </DocActionsBar>

                {showAdHocForm && (
                  <AdHocFormWrap>
                    <AdHocFormTitle>서류 추가 요청</AdHocFormTitle>
                    <AdHocInputsCol>
                      <FormInput
                        placeholder="서류명 (필수)"
                        value={adHocForm.displayName}
                        onChange={(e) =>
                          setAdHocForm((f) => ({ ...f, displayName: e.target.value }))
                        }
                      />
                      <FormRow>
                        <FormSelect
                          value={adHocForm.format}
                          onChange={(e) => setAdHocForm((f) => ({ ...f, format: e.target.value }))}
                        >
                          <option>모든 형식</option>
                          <option>PDF</option>
                          <option>이미지 (JPG/PNG)</option>
                        </FormSelect>
                        <CheckboxLabel>
                          <input
                            type="checkbox"
                            checked={adHocForm.isRequired}
                            onChange={(e) =>
                              setAdHocForm((f) => ({ ...f, isRequired: e.target.checked }))
                            }
                          />
                          필수
                        </CheckboxLabel>
                      </FormRow>
                      <FormInput
                        placeholder="요청 사유 (필수)"
                        value={adHocForm.reason}
                        onChange={(e) => setAdHocForm((f) => ({ ...f, reason: e.target.value }))}
                      />
                    </AdHocInputsCol>
                    <FormBtns>
                      <SubmitBtn
                        onClick={submitAdHocRequest}
                        disabled={!adHocForm.displayName.trim() || !adHocForm.reason.trim()}
                      >
                        요청 전송
                      </SubmitBtn>
                      <TextBtn
                        onClick={() => {
                          setShowAdHocForm(false)
                          setAdHocForm({
                            displayName: '',
                            format: '모든 형식',
                            isRequired: true,
                            reason: '',
                          })
                        }}
                      >
                        취소
                      </TextBtn>
                    </FormBtns>
                  </AdHocFormWrap>
                )}

                {(c.documents ?? []).map((doc) => {
                  const badge = DOC_STATUS_BADGE[doc.status]
                  const isRevisionOpen = docRevisionId === doc.id
                  return (
                    <DocCard key={doc.id}>
                      <DocCardTop>
                        <DocCardLeft>
                          <FileText
                            size={18}
                            color={colors.n400}
                            style={{ flexShrink: 0, marginTop: 2 }}
                          />
                          <DocMeta>
                            <DocName>{doc.displayName}</DocName>
                            {doc.uploadedFiles.length > 0 &&
                              (() => {
                                const latestFile =
                                  doc.uploadedFiles.find((f) => f.isLatest) ??
                                  doc.uploadedFiles[doc.uploadedFiles.length - 1]
                                const oldFiles = doc.uploadedFiles.filter(
                                  (f) => f.id !== latestFile.id
                                )
                                const isExpanded = expandedDocFiles.has(doc.id)
                                return (
                                  <FileHistory>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <FileNameBtn onClick={() => setPreviewFile(latestFile)}>
                                        <Eye size={12} />
                                        {latestFile.fileName}
                                        <FileDate>{formatDate(latestFile.uploadedAt)}</FileDate>
                                      </FileNameBtn>
                                      {latestFile.dataUrl && (
                                        <DownloadTextBtn onClick={() => downloadFile(latestFile)}>
                                          <DownloadSimple size={12} />
                                          다운로드
                                        </DownloadTextBtn>
                                      )}
                                    </div>
                                    {oldFiles.length > 0 && (
                                      <>
                                        <OldFilesToggle
                                          onClick={() => toggleDocFilesExpand(doc.id)}
                                        >
                                          {isExpanded ? (
                                            <CaretUp size={10} />
                                          ) : (
                                            <CaretDown size={10} />
                                          )}
                                          이전 제출본 {oldFiles.length}건
                                        </OldFilesToggle>
                                        {isExpanded &&
                                          oldFiles.map((f) => (
                                            <OldFileItem key={f.id}>
                                              <OldFileBtn onClick={() => setPreviewFile(f)}>
                                                {f.fileName} ({formatDate(f.uploadedAt)})
                                              </OldFileBtn>
                                              {f.dataUrl && (
                                                <DownloadTextBtn
                                                  onClick={() => downloadFile(f)}
                                                  style={{ flexShrink: 0 }}
                                                >
                                                  <DownloadSimple size={11} />
                                                </DownloadTextBtn>
                                              )}
                                            </OldFileItem>
                                          ))}
                                      </>
                                    )}
                                  </FileHistory>
                                )
                              })()}
                            {doc.isAdHoc && (
                              <AdHocBadge>
                                추가 요청 ({doc.requestedBy}) · {doc.revisionHistory[0]?.reason}
                              </AdHocBadge>
                            )}
                            {!doc.isAdHoc && doc.revisionHistory.length > 0 && (
                              <RevisionBadge>
                                보완 사유:{' '}
                                {doc.revisionHistory[doc.revisionHistory.length - 1].reason ||
                                  '(사유 없음)'}
                              </RevisionBadge>
                            )}
                          </DocMeta>
                        </DocCardLeft>
                        <DocCardRight>
                          <DocStatusPill bg={badge.bg} text={badge.text}>
                            {badge.label}
                          </DocStatusPill>
                          {doc.status === 'SUBMITTED' && (
                            <>
                              {role === 'COMPLIANCE' && (
                                <ApproveChip onClick={() => approveDoc(doc.id)}>
                                  <Check size={13} weight="bold" />
                                  승인
                                </ApproveChip>
                              )}
                              {(role === 'COMPLIANCE' || role === 'SALES' || role === 'OPS') && (
                                <RevisionChip
                                  onClick={() => {
                                    setDocRevisionId(isRevisionOpen ? null : doc.id)
                                    setDocRevisionNote('')
                                  }}
                                >
                                  <X size={13} weight="bold" />
                                  보완요청
                                </RevisionChip>
                              )}
                            </>
                          )}
                        </DocCardRight>
                      </DocCardTop>

                      {isRevisionOpen && (
                        <RevisionFormRow>
                          <RevisionInput
                            placeholder="보완 요청 사유를 입력하세요"
                            value={docRevisionNote}
                            onChange={(e) => setDocRevisionNote(e.target.value)}
                          />
                          <RevisionSendBtn
                            onClick={() => requestDocRevision(doc.id)}
                            disabled={!docRevisionNote.trim()}
                          >
                            전송
                          </RevisionSendBtn>
                          <RevisionCancelBtn
                            onClick={() => {
                              setDocRevisionId(null)
                              setDocRevisionNote('')
                            }}
                          >
                            취소
                          </RevisionCancelBtn>
                        </RevisionFormRow>
                      )}
                    </DocCard>
                  )
                })}
              </>
            )}
          </DocsCol>
        )}

        {/* ── 이력 탭 ── */}
        {tab === 'history' && (
          <HistoryGrid>
            <HistoryLeft>
              <TimelineCard>
                <TimelineTitle>상태 변경 이력</TimelineTitle>
                <TimelineList>
                  {(c.statusHistory ?? []).map((h, i) => {
                    const isOwnerChange =
                      h.previousStatus !== null && h.previousStatus === h.newStatus
                    return (
                      <TimelineItem key={h.id}>
                        <DotCol>
                          <Dot variant={i === 0 ? 'current' : isOwnerChange ? 'owner' : 'past'}>
                            {i === 0 ? (
                              <CheckCircle size={14} weight="fill" color={colors.white} />
                            ) : isOwnerChange ? (
                              <span style={{ fontSize: 10, color: colors.n500 }}>↔</span>
                            ) : (
                              <Clock size={14} color={colors.n400} />
                            )}
                          </Dot>
                          {i < (c.statusHistory ?? []).length - 1 && <DotLine />}
                        </DotCol>
                        <TimelineMeta>
                          <TimelineLabel muted={isOwnerChange}>
                            {isOwnerChange
                              ? '담당자 변경'
                              : (STATUS_LABELS[h.newStatus as CaseStatus] ?? h.newStatus)}
                          </TimelineLabel>
                          <TimelineTimestamp>
                            {formatDate(h.changedAt)} · {h.changedBy.name}
                          </TimelineTimestamp>
                          {h.notes && <TimelineNoteText>{h.notes}</TimelineNoteText>}
                        </TimelineMeta>
                      </TimelineItem>
                    )
                  })}
                </TimelineList>
              </TimelineCard>
            </HistoryLeft>

            <HistoryRight>
              {/* Customer chat */}
              <SideCard>
                <SideCardHeader>
                  <ChatCircle size={15} />
                  고객 채팅
                </SideCardHeader>
                <ScrollList maxHeight={240}>
                  {(c.messages ?? []).length === 0 ? (
                    <EmptyChatMsg>메시지가 없습니다.</EmptyChatMsg>
                  ) : (
                    (c.messages ?? []).map((msg) => {
                      const isMe = msg.sender.role !== 'CUSTOMER'
                      return (
                        <MsgItemWrap key={msg.id} isMe={isMe}>
                          <MsgSender>{msg.sender.name}</MsgSender>
                          <MsgBubble isMe={isMe}>{msg.text}</MsgBubble>
                          <MsgTime>{formatDate(msg.sentAt)}</MsgTime>
                        </MsgItemWrap>
                      )
                    })
                  )}
                </ScrollList>
                <ChatInputRow>
                  <ChatInputEl
                    placeholder="고객에게 메시지 전송"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <SendIconBtn onClick={sendMessage}>
                    <PaperPlaneTilt size={14} weight="fill" />
                  </SendIconBtn>
                </ChatInputRow>
              </SideCard>

              {/* Internal notes */}
              <SideCard>
                <SideCardHeader>
                  <Note size={15} />
                  내부 노트{' '}
                  <span style={{ fontSize: 11, fontWeight: 400, color: colors.n400 }}>
                    (고객 비공개)
                  </span>
                </SideCardHeader>
                <ScrollList maxHeight={200}>
                  {notes.length === 0 ? (
                    <EmptyChatMsg>내부 노트가 없습니다.</EmptyChatMsg>
                  ) : (
                    notes.map((note) => (
                      <NoteItem key={note.id}>
                        <NoteText>{note.text}</NoteText>
                        <NoteAuthor>
                          {note.author.name} · {formatDate(note.createdAt)}
                        </NoteAuthor>
                      </NoteItem>
                    ))
                  )}
                </ScrollList>
                <ChatInputRow>
                  <ChatInputEl
                    placeholder="내부 메모 작성"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        sendNote()
                      }
                    }}
                  />
                  <SendIconBtn bg="#fbbf24" onClick={sendNote}>
                    <PaperPlaneTilt size={14} weight="fill" />
                  </SendIconBtn>
                </ChatInputRow>
              </SideCard>
            </HistoryRight>
          </HistoryGrid>
        )}
      </PageBody>

      {/* ── Action bar ── */}
      {actions.length > 0 && (
        <ActionBarWrap>
          <ActionBarInner>
            {pendingAction && (
              <PendingRow>
                {pendingAction.isConfirmOnly ? (
                  <>
                    <ConfirmLabel>
                      <strong>{pendingAction.label}</strong>을 실행하시겠습니까?
                    </ConfirmLabel>
                    <ConfirmBtns>
                      <PrimaryActionBtn onClick={() => executeAction(pendingAction)}>
                        확인
                      </PrimaryActionBtn>
                      <TextCancelBtn
                        onClick={() => {
                          setPendingAction(null)
                          setActionNote('')
                        }}
                      >
                        취소
                      </TextCancelBtn>
                    </ConfirmBtns>
                  </>
                ) : (
                  <>
                    <NoteActionWrap>
                      <NoteActionLabel>
                        {pendingAction.label} —{' '}
                        {pendingAction.needsNote ? '사유를 입력하세요 (필수)' : '메모 (선택)'}
                      </NoteActionLabel>
                      <Textarea
                        rows={2}
                        placeholder="사유를 입력하세요"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                      />
                    </NoteActionWrap>
                    <NoteActionBtns>
                      <PrimaryActionBtn
                        onClick={() => executeAction(pendingAction)}
                        disabled={pendingAction.needsNote && !actionNote.trim()}
                      >
                        확인
                      </PrimaryActionBtn>
                      <TextCancelBtn
                        onClick={() => {
                          setPendingAction(null)
                          setActionNote('')
                        }}
                      >
                        취소
                      </TextCancelBtn>
                    </NoteActionBtns>
                  </>
                )}
              </PendingRow>
            )}

            <ActionBtnRow>
              {actions.map((action) => (
                <ActionBtnEl
                  key={action.label}
                  variant={action.variant}
                  selected={pendingAction?.label === action.label}
                  onClick={() => {
                    if (pendingAction?.label === action.label) {
                      setPendingAction(null)
                      setActionNote('')
                    } else {
                      setPendingAction(action)
                      setActionNote('')
                    }
                  }}
                >
                  {action.label}
                </ActionBtnEl>
              ))}
            </ActionBtnRow>
          </ActionBarInner>
        </ActionBarWrap>
      )}

      {/* File preview modal */}
      {previewFile && (
        <ModalOverlay onClick={() => setPreviewFile(null)}>
          <ModalPanel onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalFileName>{previewFile.fileName}</ModalFileName>
              <ModalHeaderBtns>
                {previewFile.dataUrl && (
                  <ModalDownloadBtn onClick={() => downloadFile(previewFile)}>
                    <DownloadSimple size={14} />
                    다운로드
                  </ModalDownloadBtn>
                )}
                <ModalCloseBtn onClick={() => setPreviewFile(null)}>닫기</ModalCloseBtn>
              </ModalHeaderBtns>
            </ModalHeader>
            <ModalBody>
              {previewFile.dataUrl && previewFile.dataUrl.startsWith('data:image') ? (
                <PreviewImg src={previewFile.dataUrl} alt={previewFile.fileName} />
              ) : previewFile.dataUrl ? (
                <PreviewIframe src={previewFile.dataUrl} title={previewFile.fileName} />
              ) : (
                <PreviewEmpty>
                  <FileText size={48} color={colors.n300} />
                  <p style={{ fontSize: 14, color: colors.n500, margin: 0 }}>
                    {previewFile.fileName}
                  </p>
                  <p style={{ fontSize: 12, color: colors.n400, margin: 0 }}>
                    미리보기를 지원하지 않는 파일입니다.
                  </p>
                </PreviewEmpty>
              )}
            </ModalBody>
          </ModalPanel>
        </ModalOverlay>
      )}

      {/* REVISION_REQUESTED 상태 안내 */}
      {c.status === 'REVISION_REQUESTED' && (
        <RevisionBanner>
          <RevisionBannerInner>
            <WarningCircle size={16} color="#f97316" style={{ flexShrink: 0 }} />
            <RevisionBannerText>고객의 서류 보완을 기다리는 중입니다.</RevisionBannerText>
          </RevisionBannerInner>
        </RevisionBanner>
      )}
    </PageWrap>
  )
}

export default function InternalCasePage() {
  return (
    <Suspense fallback={null}>
      <CaseDetailContent />
    </Suspense>
  )
}
