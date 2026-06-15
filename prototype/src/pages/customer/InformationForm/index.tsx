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

  const { entitySegment, serviceSegments } = c.segmentInfo

  if (entitySegment === 'SentBiz Corporate')
    return <CorporateForm serviceSegments={serviceSegments} onComplete={handleComplete} />
  if (entitySegment === 'SentBiz Individual')
    return <IndividualForm serviceSegments={serviceSegments} onComplete={handleComplete} />
  return <FIForm serviceSegments={serviceSegments} onComplete={handleComplete} />
}
