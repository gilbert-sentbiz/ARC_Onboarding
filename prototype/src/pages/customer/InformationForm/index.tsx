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
  const [accumulated, setAccumulated] = useState<Record<string, unknown>>(() => {
    if (c?.secondIntake?.status === 'draft') {
      return c.secondIntake.data as Record<string, unknown>
    }
    // P1: 2차 첫 진입 시 1차 입력값 자동채움
    const fi = (c?.firstIntake?.data ?? {}) as Record<string, unknown>
    const rawSeg = (c?.segmentInfo as unknown as Record<string, unknown>) ?? {}
    const seg = (rawSeg.entitySegment ?? rawSeg.customerType) as string | undefined
    const fiServices = Array.isArray(fi.services) ? (fi.services as string[]) : []
    const fiColl = Array.isArray(fi.collectionCountries) ? (fi.collectionCountries as string[]) : []
    const fiServiceSegs = Array.isArray(rawSeg.serviceSegments) ? (rawSeg.serviceSegments as string[]) : []

    const entityInit: Record<string, unknown> = {}
    if (seg === 'SentBiz Corporate') {
      if (fi.companyName) entityInit.companyNameKr = fi.companyName
      if (fi.phone) entityInit.phone = fi.phone
      if (fi.foundingCountry) entityInit.corpNationality = fi.foundingCountry
    } else if (seg === 'SentBiz Individual') {
      if (fi.companyName) entityInit.bizName = fi.companyName
      if (fi.phone) entityInit.phone = fi.phone
    } else if (seg === 'FI') {
      if (fi.companyName) entityInit.legalName = fi.companyName
      if (fi.foundingCountry) entityInit.incorpCountry = fi.foundingCountry
      if (fi.phone) entityInit.repPhone = fi.phone
      if (fi.email) entityInit.repEmail = fi.email
      const fiBServices: string[] = []
      if (fiServices.includes('collection')) fiBServices.push('collection')
      if (fiServices.includes('remittance')) fiBServices.push('payout')
      if (fiBServices.length > 0) entityInit.services = fiBServices
      const fiCurrencies = fiColl.filter((v) => v !== 'OTHER')
      if (fiCurrencies.length > 0) entityInit.collectionCurrencies = fiCurrencies
      if (fi.remittanceFrom) entityInit.originCountries = fi.remittanceFrom
    }

    const result: Record<string, unknown> = {}
    if (Object.keys(entityInit).length > 0) result.entity = entityInit
    if (fiServiceSegs.includes('VND Collection')) {
      const vndInit: Record<string, unknown> = {}
      if (fi.companyName) vndInit.entityName = fi.companyName
      if (fi.foundingCountry) vndInit.placeOfIncorp = fi.foundingCountry
      if (fi.contactName) vndInit.contactName = fi.contactName
      if (fi.phone) vndInit.contactPhone = fi.phone
      if (fi.email) vndInit.contactEmail = fi.email
      if (fi.monthlyVolume) vndInit.monthlyVolume = fi.monthlyVolume
      if (Object.keys(vndInit).length > 0) result.vndCollection = vndInit
    }
    return result
  })

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
        initialData={(accumulated.krwCollection as Record<string, unknown>) ?? {}}
        onComplete={handleKRWComplete}
        onBack={() => setStage('entity')}
        onDraftSave={(d) => saveDraft({ ...accumulated, krwCollection: d })}
      />
    )

  if (stage === 'vnd')
    return (
      <VNDCollectionSection
        initialData={(accumulated.vndCollection as Record<string, unknown>) ?? {}}
        onComplete={handleVNDComplete}
        onBack={() => { needsKRW ? setStage('krw') : setStage('entity') }}
        onDraftSave={(d) => saveDraft({ ...accumulated, vndCollection: d })}
      />
    )

  // entity stage
  const entityProps = {
    serviceSegments,
    initialData: (accumulated.entity as Record<string, unknown>) ?? {},
    onDraftSave: (d: Record<string, unknown>) => saveDraft({ ...accumulated, entity: d }),
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
