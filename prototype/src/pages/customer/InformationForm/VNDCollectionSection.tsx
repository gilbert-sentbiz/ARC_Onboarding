import { useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import RadioGroup from '../../../components/ui/RadioGroup'
import Textarea from '../../../components/ui/Textarea'
import Button from '../../../components/ui/Button'
import FormShell from './FormShell'
import { COUNTRIES } from '../../../constants/countries'

interface Props {
  initialData?: Record<string, unknown>
  onComplete: (data: Record<string, unknown>) => void
  onBack: () => void
  onDraftSave?: (data: Record<string, unknown>) => void
}

type Errors = Record<string, string>

const ENTITY_TYPE_OPTIONS = [
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_prop', label: 'Sole Proprietorship' },
  { value: 'other', label: 'Other' },
]

const VOLUME_OPTIONS = [
  { value: 'under_10k', label: 'Under $10,000' },
  { value: '10k_50k', label: '$10,000 – $50,000' },
  { value: '50k_200k', label: '$50,000 – $200,000' },
  { value: '200k_500k', label: '$200,000 – $500,000' },
  { value: 'over_500k', label: 'Over $500,000' },
]

export default function VNDCollectionSection({ initialData, onComplete, onBack, onDraftSave }: Props) {
  const [errors, setErrors] = useState<Errors>({})

  const d = initialData ?? {}
  const [entityName, setEntityName] = useState((d.entityName as string) ?? '')
  const [bizNumber, setBizNumber] = useState((d.bizNumber as string) ?? '')
  const [bizAddress, setBizAddress] = useState((d.bizAddress as string) ?? '')
  const [placeOfIncorp, setPlaceOfIncorp] = useState((d.placeOfIncorp as string) ?? '')
  const [website, setWebsite] = useState((d.website as string) ?? '')
  const [contactName, setContactName] = useState((d.contactName as string) ?? '')
  const [contactPhone, setContactPhone] = useState((d.contactPhone as string) ?? '')
  const [contactEmail, setContactEmail] = useState((d.contactEmail as string) ?? '')
  const [entityType, setEntityType] = useState((d.entityType as string) ?? '')
  const [industryType, setIndustryType] = useState((d.industryType as string) ?? '')
  const [mainActivity, setMainActivity] = useState((d.mainActivity as string) ?? '')
  const [monthlyVolume, setMonthlyVolume] = useState((d.monthlyVolume as string) ?? '')
  const [accountPurpose, setAccountPurpose] = useState((d.accountPurpose as string) ?? '')
  const [depositorRelationship, setDepositorRelationship] = useState((d.depositorRelationship as string) ?? '')
  const [depositorType, setDepositorType] = useState((d.depositorType as string) ?? '')

  function clearErr(k: string) { setErrors(e => ({ ...e, [k]: undefined as unknown as string })) }

  function validate(): boolean {
    const e: Errors = {}
    if (!entityName.trim()) e.entityName = '필수 항목입니다.'
    if (!bizNumber.trim()) e.bizNumber = '필수 항목입니다.'
    if (!bizAddress.trim()) e.bizAddress = '필수 항목입니다.'
    if (!placeOfIncorp) e.placeOfIncorp = '선택해주세요.'
    if (!website.trim()) e.website = '필수 항목입니다.'
    if (!contactName.trim()) e.contactName = '필수 항목입니다.'
    if (!contactPhone.trim()) e.contactPhone = '필수 항목입니다.'
    if (!contactEmail.trim()) e.contactEmail = '필수 항목입니다.'
    if (!entityType) e.entityType = '선택해주세요.'
    if (!industryType.trim()) e.industryType = '필수 항목입니다.'
    if (!mainActivity.trim()) e.mainActivity = '필수 항목입니다.'
    if (!monthlyVolume) e.monthlyVolume = '선택해주세요.'
    if (!accountPurpose.trim()) e.accountPurpose = '필수 항목입니다.'
    if (!depositorRelationship.trim()) e.depositorRelationship = '필수 항목입니다.'
    if (!depositorType) e.depositorType = '선택해주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validate()) return
    onComplete({
      entityName, bizNumber, bizAddress, placeOfIncorp, website,
      contactName, contactPhone, contactEmail, entityType, industryType,
      mainActivity, monthlyVolume, accountPurpose, depositorRelationship, depositorType,
    })
  }

  return (
    <FormShell step={0} totalSteps={1} titles={['VND Collection — 사업자 정보']} onBack={onBack} onDraftSave={onDraftSave ? () => onDraftSave({ entityName, bizNumber, bizAddress, placeOfIncorp, website, contactName, contactPhone, contactEmail, entityType, industryType, mainActivity, monthlyVolume, accountPurpose, depositorRelationship, depositorType }) : undefined}>
      <div className="flex flex-col gap-5">

        <div className="flex flex-col gap-4">
          <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">사업자 기본 정보</p>
          <Input
            label="Full Name of Entity / Business"
            required
            value={entityName}
            onChange={e => { setEntityName(e.target.value); clearErr('entityName') }}
            error={errors.entityName}
          />
          <Input
            label="Business Number (UEN / NIB / ERC)"
            required
            value={bizNumber}
            onChange={e => { setBizNumber(e.target.value); clearErr('bizNumber') }}
            error={errors.bizNumber}
          />
          <Input
            label="Registered Business Address"
            required
            value={bizAddress}
            onChange={e => { setBizAddress(e.target.value); clearErr('bizAddress') }}
            error={errors.bizAddress}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Place of Incorporation"
              required
              options={COUNTRIES}
              placeholder="선택"
              value={placeOfIncorp}
              onChange={e => { setPlaceOfIncorp(e.target.value); clearErr('placeOfIncorp') }}
              error={errors.placeOfIncorp}
            />
            <Input
              label="Business Website"
              required
              placeholder="https://"
              value={website}
              onChange={e => { setWebsite(e.target.value); clearErr('website') }}
              error={errors.website}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Entity Type"
              required
              options={ENTITY_TYPE_OPTIONS}
              placeholder="선택"
              value={entityType}
              onChange={e => { setEntityType(e.target.value); clearErr('entityType') }}
              error={errors.entityType}
            />
            <Input
              label="Industry Type"
              required
              value={industryType}
              onChange={e => { setIndustryType(e.target.value); clearErr('industryType') }}
              error={errors.industryType}
            />
          </div>
          <Textarea
            label="Main Business Activity"
            required
            value={mainActivity}
            onChange={e => { setMainActivity(e.target.value); clearErr('mainActivity') }}
            rows={2}
            error={errors.mainActivity}
          />
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">담당자 정보</p>
          <Input
            label="Name of Contact Person"
            required
            value={contactName}
            onChange={e => { setContactName(e.target.value); clearErr('contactName') }}
            error={errors.contactName}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Number"
              required
              value={contactPhone}
              onChange={e => { setContactPhone(e.target.value); clearErr('contactPhone') }}
              error={errors.contactPhone}
            />
            <Input
              label="Email of Contact Person"
              required
              type="email"
              value={contactEmail}
              onChange={e => { setContactEmail(e.target.value); clearErr('contactEmail') }}
              error={errors.contactEmail}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">거래 정보</p>
          <Select
            label="Anticipated Monthly Volume"
            required
            options={VOLUME_OPTIONS}
            placeholder="선택해주세요"
            value={monthlyVolume}
            onChange={e => { setMonthlyVolume(e.target.value); clearErr('monthlyVolume') }}
            error={errors.monthlyVolume}
          />
          <Textarea
            label="Purpose of Opening Account"
            required
            value={accountPurpose}
            onChange={e => { setAccountPurpose(e.target.value); clearErr('accountPurpose') }}
            rows={2}
            error={errors.accountPurpose}
          />
          <Input
            label="Relationship with the Depositor"
            required
            placeholder="예: 해외 거래처, 플랫폼 판매자 등"
            value={depositorRelationship}
            onChange={e => { setDepositorRelationship(e.target.value); clearErr('depositorRelationship') }}
            error={errors.depositorRelationship}
          />
          <RadioGroup
            label="Depositor Type"
            required
            options={[{ value: 'corporate', label: 'Corporate' }, { value: 'individual', label: 'Individual' }]}
            value={depositorType}
            onChange={v => { setDepositorType(v); clearErr('depositorType') }}
            error={errors.depositorType}
          />
        </div>

      </div>
      <div className="pt-4">
        <Button onClick={handleNext} fullWidth>
          다음 <ArrowRight size={16} />
        </Button>
      </div>
    </FormShell>
  )
}
