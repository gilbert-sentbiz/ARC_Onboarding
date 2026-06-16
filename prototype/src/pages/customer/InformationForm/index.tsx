import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCaseStore } from '../../../store/caseStore'
import type { ServiceSegment } from '../../../types'
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
  const [accumulated, setAccumulated] = useState<Record<string, unknown>>(
    () => (c?.secondIntake?.status === 'draft' ? (c.secondIntake.data as Record<string, unknown>) : {})
  )

  if (!c) {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <p className="text-sb-n500">케이스를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const raw = c.segmentInfo as unknown as Record<string, unknown>
  const entitySegment = (raw.entitySegment ?? raw.customerType) as string | undefined
  const serviceSegments = (raw.serviceSegments ?? []) as ServiceSegment[]
  const needsKRW = serviceSegments.includes('KRW Collection')
  const needsVND = serviceSegments.includes('VND Collection')

  function saveDraft(partial: Record<string, unknown>) {
    if (!id) return
    updateCase(id, {
      secondIntake: { status: 'draft', data: partial, savedAt: Date.now() },
    })
  }

  function saveAndNavigate(data: Record<string, unknown>) {
    if (!id) return
    updateCase(id, { secondIntake: { status: 'draft', data, savedAt: Date.now() } })
    navigate(`/customer/case/${id}/review/second`)
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
    return (
      <KRWCollectionSection
        onComplete={handleKRWComplete}
        onBack={() => setStage('entity')}
        onDraftSave={(d) => saveDraft({ ...accumulated, krwCollection: d })}
      />
    )

  if (stage === 'vnd')
    return (
      <VNDCollectionSection
        onComplete={handleVNDComplete}
        onBack={() => { needsKRW ? setStage('krw') : setStage('entity') }}
        onDraftSave={(d) => saveDraft({ ...accumulated, vndCollection: d })}
      />
    )

  // entity stage
  const entityProps = {
    serviceSegments,
    onDraftSave: (d: Record<string, unknown>) => saveDraft({ entity: d }),
  }

  if (entitySegment === 'SentBiz Corporate')
    return <CorporateForm {...entityProps} onComplete={handleEntityComplete} />
  if (entitySegment === 'SentBiz Individual')
    return <IndividualForm {...entityProps} onComplete={handleEntityComplete} />
  if (entitySegment === 'FI')
    return <FIForm {...entityProps} onComplete={handleEntityComplete} />

  navigate('/customer/onboarding', { replace: true })
  return null
}
