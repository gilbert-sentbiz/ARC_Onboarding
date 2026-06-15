import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, ArrowRight, ClockCounterClockwise } from '@phosphor-icons/react'
import { useCaseStore } from '../../store/caseStore'
import { STATUS_LABELS } from '../../services/stateMachine'
import Button from '../../components/ui/Button'

const ENTITY_LABELS: Record<string, string> = {
  'SentBiz Corporate': '법인 사업자',
  'SentBiz Individual': '개인 사업자',
  'FI': '금융기관',
}

const RISK_LABELS: Record<string, string> = { LOW: '낮음', MEDIUM: '보통', HIGH: '높음' }
const RISK_COLORS: Record<string, string> = {
  LOW: 'text-sb-positive',
  MEDIUM: 'text-sb-warning',
  HIGH: 'text-sb-negative',
}

type Step = { label: string; done: boolean; active: boolean }

export default function CasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  if (!c) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const hasIntake = !!c.intakeData
  const hasDocSubmitted = c.documents.some(d => d.status !== 'NOT_REQUESTED')
  const isUnderReview = ['COMPLIANCE_REVIEW_REQUIRED', 'OPS_REVIEW_REQUIRED'].includes(c.status)
  const isDone = c.status === 'COMPLETED'
  const isClosed = c.status === 'CLOSED'

  const steps: Step[] = [
    { label: '1차 문의 접수', done: true, active: false },
    { label: '상세 정보 입력', done: hasIntake, active: !hasIntake },
    { label: '서류 업로드', done: hasDocSubmitted, active: hasIntake && !hasDocSubmitted },
    { label: '검토 진행 중', done: isDone, active: isUnderReview },
    { label: '온보딩 완료', done: isDone, active: false },
  ]

  function renderCTA() {
    if (isClosed) return null
    if (!hasIntake)
      return (
        <Button onClick={() => navigate(`/customer/case/${id}/information`)}>
          2차 정보 입력하기 <ArrowRight size={16} />
        </Button>
      )
    if (!hasDocSubmitted)
      return (
        <Button onClick={() => navigate(`/customer/case/${id}/documents`)}>
          서류 업로드하기 <ArrowRight size={16} />
        </Button>
      )
    return (
      <div className="flex items-center gap-2 text-[14px] text-sb-n500">
        <ClockCounterClockwise size={18} />
        검토 진행 중입니다. 진행 상황이 변경되면 이메일로 안내드려요.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-[600px] flex flex-col gap-5">

        {/* 상태 헤더 */}
        <div className="bg-white rounded-[16px] p-6 flex flex-col gap-4" style={{ boxShadow: 'var(--shadow-200)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase mb-1">케이스 #{c.id.slice(-6).toUpperCase()}</p>
              <h2 className="text-[20px] font-bold text-sb-n900">{c.customerName}</h2>
              <p className="text-[13px] text-sb-n500 mt-0.5">{c.customerEmail}</p>
            </div>
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-medium ${
              isDone ? 'bg-sb-positive-light text-sb-positive'
              : isClosed ? 'bg-sb-n100 text-sb-n500'
              : 'bg-sb-blue-100 text-sb-brand'
            }`}>
              {STATUS_LABELS[c.status]}
            </span>
          </div>

          {/* 세그먼트 정보 */}
          <div className="pt-4 border-t border-sb-n100 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-sb-n400 uppercase tracking-[0.5px]">사업자 유형</p>
              <p className="text-[13px] font-medium text-sb-n800 mt-0.5">{ENTITY_LABELS[c.segmentInfo.entitySegment]}</p>
            </div>
            <div>
              <p className="text-[11px] text-sb-n400 uppercase tracking-[0.5px]">컴플라이언스 등급</p>
              <p className={`text-[13px] font-medium mt-0.5 ${RISK_COLORS[c.segmentInfo.complianceRisk]}`}>
                {RISK_LABELS[c.segmentInfo.complianceRisk]}
              </p>
            </div>
            {c.segmentInfo.serviceSegments.length > 0 && (
              <div className="col-span-2">
                <p className="text-[11px] text-sb-n400 uppercase tracking-[0.5px]">서비스</p>
                <p className="text-[13px] font-medium text-sb-n800 mt-0.5">
                  {c.segmentInfo.serviceSegments.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 진행 단계 */}
        <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: 'var(--shadow-200)' }}>
          <p className="text-[13px] font-semibold text-sb-n600 mb-4">진행 단계</p>
          <div className="flex flex-col gap-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  {step.done ? (
                    <CheckCircle size={20} weight="fill" className="text-sb-brand flex-shrink-0" />
                  ) : step.active ? (
                    <div className="w-5 h-5 rounded-full border-2 border-sb-brand bg-sb-blue-100 flex-shrink-0" />
                  ) : (
                    <Circle size={20} className="text-sb-n300 flex-shrink-0" />
                  )}
                  {i < steps.length - 1 && (
                    <div className={`w-px h-6 mt-0.5 ${step.done ? 'bg-sb-brand' : 'bg-sb-n200'}`} />
                  )}
                </div>
                <p className={`pt-0.5 text-[14px] ${
                  step.done ? 'text-sb-n900 font-medium'
                  : step.active ? 'text-sb-brand font-semibold'
                  : 'text-sb-n400'
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: 'var(--shadow-200)' }}>
          {renderCTA()}
        </div>

      </div>
    </div>
  )
}
