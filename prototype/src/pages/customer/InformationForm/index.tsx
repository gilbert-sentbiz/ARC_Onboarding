import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCaseStore } from '../../../store/caseStore'
import CorporateForm from './CorporateForm'
import IndividualForm from './IndividualForm'
import FIForm from './FIForm'
import KRWCollectionSection from './KRWCollectionSection'
import VNDCollectionSection from './VNDCollectionSection'

type Stage = 'entity' | 'krw' | 'vnd'

export default function InformationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateCase = useCaseStore((s) => s.updateCase)
  const c = useCaseStore((s) => (id ? s.cases[id] : null))

  const [stage, setStage] = useState<Stage>('entity')
  const [accumulated, setAccumulated] = useState<Record<string, unknown>>({})

  if (!c) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { entitySegment, serviceSegments = [] } = c.segmentInfo
  const needsKRW = serviceSegments.includes('KRW Collection')
  const needsVND = serviceSegments.includes('VND Collection')

  function saveAndNavigate(data: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { intakeData: data })
    navigate(`/customer/case/${id}`)
  }

  function handleEntityComplete(data: Record<string, unknown>) {
    const next = { ...accumulated, entity: data }
    setAccumulated(next)
    if (needsKRW) { setStage('krw'); window.scrollTo({ top: 0 }) }
    else if (needsVND) { setStage('vnd'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  function handleKRWComplete(data: Record<string, unknown>) {
    const next = { ...accumulated, krwCollection: data }
    setAccumulated(next)
    if (needsVND) { setStage('vnd'); window.scrollTo({ top: 0 }) }
    else saveAndNavigate(next)
  }

  function handleVNDComplete(data: Record<string, unknown>) {
    saveAndNavigate({ ...accumulated, vndCollection: data })
  }

  if (stage === 'krw')
    return <KRWCollectionSection onComplete={handleKRWComplete} onBack={() => setStage('entity')} />

  if (stage === 'vnd')
    return (
      <VNDCollectionSection
        onComplete={handleVNDComplete}
        onBack={() => { needsKRW ? setStage('krw') : setStage('entity') }}
      />
    )

  // entity stage
  const entityProps = { serviceSegments, onComplete: handleEntityComplete }

  if (entitySegment === 'SentBiz Corporate') return <CorporateForm {...entityProps} />
  if (entitySegment === 'SentBiz Individual') return <IndividualForm {...entityProps} />
  if (entitySegment === 'FI') return <FIForm {...entityProps} />

  return (
    <div className="min-h-screen bg-sb-n50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[16px] p-8 max-w-[400px] text-center" style={{ boxShadow: 'var(--shadow-200)' }}>
        <p className="text-[16px] font-semibold text-sb-n900 mb-2">세션이 만료되었습니다</p>
        <p className="text-[14px] text-sb-n500">1차 설문을 다시 제출해주세요.</p>
      </div>
    </div>
  )
}
