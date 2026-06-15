import { useParams, useNavigate } from 'react-router-dom'
import { useCaseStore } from '../../../store/caseStore'
import CorporateForm from './CorporateForm'
import IndividualForm from './IndividualForm'
import FIForm from './FIForm'

export default function InformationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateCase = useCaseStore((s) => s.updateCase)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  if (!c) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  function handleComplete(data: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { intakeData: data })
    navigate(`/customer/case/${id}`)
  }

  const { entitySegment, serviceSegments = [] } = c.segmentInfo

  if (entitySegment === 'SentBiz Corporate')
    return <CorporateForm serviceSegments={serviceSegments} onComplete={handleComplete} />
  if (entitySegment === 'SentBiz Individual')
    return <IndividualForm serviceSegments={serviceSegments} onComplete={handleComplete} />
  if (entitySegment === 'FI')
    return <FIForm serviceSegments={serviceSegments} onComplete={handleComplete} />

  // 이전 버전 데이터로 세그먼트를 확인할 수 없는 경우
  return (
    <div className="min-h-screen bg-sb-n50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[16px] p-8 max-w-[400px] text-center" style={{ boxShadow: 'var(--shadow-200)' }}>
        <p className="text-[16px] font-semibold text-sb-n900 mb-2">세션이 만료되었습니다</p>
        <p className="text-[14px] text-sb-n500">1차 설문을 다시 제출해주세요.</p>
      </div>
    </div>
  )
}
