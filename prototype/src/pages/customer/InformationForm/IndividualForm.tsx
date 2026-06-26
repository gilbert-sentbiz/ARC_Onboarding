import { useState } from 'react'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import RadioGroup from '../../../components/ui/RadioGroup'
import CheckboxGroup from '../../../components/ui/CheckboxGroup'
import Button from '../../../components/ui/Button'
import FormShell from './FormShell'
import { COUNTRIES } from '../../../constants/countries'
interface Props {
  serviceSegments: string[]
  initialData?: Record<string, unknown>
  onComplete: (data: Record<string, unknown>) => void
  onDraftSave?: (data: Record<string, unknown>) => void
}

type Errors = Record<string, string>
const TOTAL_STEPS = 3

export default function IndividualForm({ onComplete, onDraftSave, initialData }: Props) {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})

  const d = initialData ?? {}
  const rep = (d.rep as Record<string, string>) ?? {}
  const bo = (d.bo as Record<string, string>) ?? {}

  // Section 1
  const [bizName, setBizName] = useState((d.bizName as string) ?? '')
  const [bizRegNo, setBizRegNo] = useState((d.bizRegNo as string) ?? '')
  const [phone, setPhone] = useState((d.phone as string) ?? '')
  const [industry, setIndustry] = useState((d.industry as string) ?? '')
  const [bizType, setBizType] = useState((d.bizType as string) ?? '')
  const [bizAddress, setBizAddress] = useState((d.bizAddress as string) ?? '')
  const [residence, setResidence] = useState((d.residence as string) ?? '')
  const [repNameKr, setRepNameKr] = useState(rep.nameKr ?? '')
  const [repNameEn, setRepNameEn] = useState(rep.nameEn ?? '')
  const [repDob, setRepDob] = useState(rep.dob ?? '')
  const [repGender, setRepGender] = useState(rep.gender ?? '')
  const [repNationality, setRepNationality] = useState(rep.nationality ?? '')

  // Section 2
  const [boSameAsRep, setBoSameAsRep] = useState((d.boSameAsRep as string) ?? '')
  const [boNameKr, setBoNameKr] = useState(bo.nameKr ?? '')
  const [boNameEn, setBoNameEn] = useState(bo.nameEn ?? '')
  const [boDob, setBoDob] = useState(bo.dob ?? '')
  const [boNationality, setBoNationality] = useState(bo.nationality ?? '')
  const [boResidence, setBoResidence] = useState(bo.residence ?? '')

  // Section 3
  const [txPurpose, setTxPurpose] = useState((d.txPurpose as string) ?? '')
  const [txPurposeOther, setTxPurposeOther] = useState((d.txPurposeOther as string) ?? '')
  const [isVASP, setIsVASP] = useState((d.isVASP as string) ?? '')
  const [fundsSource, setFundsSource] = useState<string[]>((d.fundsSource as string[]) ?? [])
  const [fundsSourceOther, setFundsSourceOther] = useState((d.fundsSourceOther as string) ?? '')

  function formatBizRegNo(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
  }

  function clearErr(k: string) { setErrors(e => ({ ...e, [k]: undefined as unknown as string })) }

  function validate(): boolean {
    const e: Errors = {}
    if (step === 0) {
      if (!bizName.trim()) e.bizName = '필수 항목입니다.'
      if (!bizRegNo.trim()) e.bizRegNo = '필수 항목입니다.'
      if (!phone.trim()) e.phone = '필수 항목입니다.'
      if (!industry.trim()) e.industry = '필수 항목입니다.'
      if (!bizType.trim()) e.bizType = '필수 항목입니다.'
      if (!bizAddress.trim()) e.bizAddress = '필수 항목입니다.'
      if (!residence) e.residence = '선택해주세요.'
      if (!repNameKr.trim()) e.repNameKr = '필수 항목입니다.'
      if (!repNameEn.trim()) e.repNameEn = '필수 항목입니다.'
      if (!repDob) e.repDob = '필수 항목입니다.'
      if (!repGender) e.repGender = '선택해주세요.'
      if (!repNationality) e.repNationality = '선택해주세요.'
    }
    if (step === 1) {
      if (!boSameAsRep) e.boSameAsRep = '선택해주세요.'
      if (boSameAsRep === 'no') {
        if (!boNameKr.trim()) e.boNameKr = '필수 항목입니다.'
        if (!boNameEn.trim()) e.boNameEn = '필수 항목입니다.'
        if (!boDob) e.boDob = '필수 항목입니다.'
        if (!boNationality) e.boNationality = '선택해주세요.'
        if (!boResidence) e.boResidence = '선택해주세요.'
      }
    }
    if (step === 2) {
      if (!txPurpose) e.txPurpose = '선택해주세요.'
      if (!isVASP) e.isVASP = '선택해주세요.'
      if (fundsSource.length === 0) e.fundsSource = '하나 이상 선택해주세요.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function collectCurrentData(): Record<string, unknown> {
    return {
      bizName, bizRegNo, phone, industry, bizType, bizAddress, residence,
      rep: { nameKr: repNameKr, nameEn: repNameEn, dob: repDob, gender: repGender, nationality: repNationality },
      boSameAsRep,
      bo: boSameAsRep === 'no' ? { nameKr: boNameKr, nameEn: boNameEn, dob: boDob, nationality: boNationality, residence: boResidence } : null,
      txPurpose, txPurposeOther, isVASP, fundsSource, fundsSourceOther,
    }
  }

  function handleNext() {
    if (!validate()) return
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      onComplete(collectCurrentData())
    }
  }

  return (
    <FormShell step={step} totalSteps={TOTAL_STEPS} titles={['기본 정보', '실제 소유자 확인', '추가 확인사항']} onBack={() => step === 0 ? history.back() : setStep(s => s - 1)} onDraftSave={onDraftSave ? () => onDraftSave(collectCurrentData()) : undefined}>
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Section label="사업자 정보">
            <Input label="상호명" required value={bizName} onChange={e => { setBizName(e.target.value); clearErr('bizName') }} error={errors.bizName} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="사업자등록번호" required placeholder="000-00-00000" value={bizRegNo} onChange={e => { setBizRegNo(formatBizRegNo(e.target.value)); clearErr('bizRegNo') }} error={errors.bizRegNo} />
              <Input label="연락처" required value={phone} onChange={e => { setPhone(e.target.value); clearErr('phone') }} error={errors.phone} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="업종" required value={industry} onChange={e => { setIndustry(e.target.value); clearErr('industry') }} error={errors.industry} />
              <Input label="업태" required value={bizType} onChange={e => { setBizType(e.target.value); clearErr('bizType') }} error={errors.bizType} />
            </div>
            <Input label="사업장 주소" required value={bizAddress} onChange={e => { setBizAddress(e.target.value); clearErr('bizAddress') }} error={errors.bizAddress} />
            <RadioGroup label="거주지" required options={[{ value: 'domestic', label: '국내' }, { value: 'overseas', label: '국외' }]} value={residence} onChange={v => { setResidence(v); clearErr('residence') }} error={errors.residence} />
          </Section>
          <Section label="대표자 정보">
            <div className="grid grid-cols-2 gap-4">
              <Input label="성명 (한글)" required value={repNameKr} onChange={e => { setRepNameKr(e.target.value); clearErr('repNameKr') }} error={errors.repNameKr} />
              <Input label="Name (English)" required value={repNameEn} onChange={e => { setRepNameEn(e.target.value); clearErr('repNameEn') }} error={errors.repNameEn} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="생년월일" required type="date" value={repDob} onChange={e => { setRepDob(e.target.value); clearErr('repDob') }} error={errors.repDob} />
              <RadioGroup label="성별" required options={[{ value: 'M', label: '남' }, { value: 'F', label: '여' }]} value={repGender} onChange={v => { setRepGender(v); clearErr('repGender') }} error={errors.repGender} />
              <Select label="국적" required options={COUNTRIES} placeholder="선택" value={repNationality} onChange={e => { setRepNationality(e.target.value); clearErr('repNationality') }} error={errors.repNationality} />
            </div>
          </Section>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Section label="실제 소유자 확인">
            <RadioGroup
              label="대표자와 실제 소유자가 동일합니까?"
              required
              options={[{ value: 'yes', label: '예, 동일합니다' }, { value: 'no', label: '아니오, 다릅니다' }]}
              value={boSameAsRep}
              onChange={v => { setBoSameAsRep(v); clearErr('boSameAsRep') }}
              error={errors.boSameAsRep}
            />
            {boSameAsRep === 'no' && (
              <div className="flex flex-col gap-4 p-4 bg-sb-n50 rounded-[10px] border border-sb-n200">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="성명 (한글)" required value={boNameKr} onChange={e => { setBoNameKr(e.target.value); clearErr('boNameKr') }} error={errors.boNameKr} />
                  <Input label="Name (English)" required value={boNameEn} onChange={e => { setBoNameEn(e.target.value); clearErr('boNameEn') }} error={errors.boNameEn} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="생년월일" required type="date" value={boDob} onChange={e => { setBoDob(e.target.value); clearErr('boDob') }} error={errors.boDob} />
                  <Select label="국적" required options={COUNTRIES} placeholder="선택" value={boNationality} onChange={e => { setBoNationality(e.target.value); clearErr('boNationality') }} error={errors.boNationality} />
                  <Select label="거주국가" required options={COUNTRIES} placeholder="선택" value={boResidence} onChange={e => { setBoResidence(e.target.value); clearErr('boResidence') }} error={errors.boResidence} />
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Section label="추가 확인사항">
            <RadioGroup
              label="거래목적"
              required
              layout="col"
              options={[{ value: 'settlement', label: '판매대금 정산대행' }, { value: 'other', label: '기타' }]}
              value={txPurpose}
              onChange={v => { setTxPurpose(v); clearErr('txPurpose') }}
              error={errors.txPurpose}
            />
            {txPurpose === 'other' && <Input placeholder="거래 목적을 입력해주세요" value={txPurposeOther} onChange={e => setTxPurposeOther(e.target.value)} />}

            <RadioGroup
              label="가상자산취급업소 여부"
              required
              options={[{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }]}
              value={isVASP}
              onChange={v => { setIsVASP(v); clearErr('isVASP') }}
              error={errors.isVASP}
            />

            <CheckboxGroup
              label="자금 및 재산 원천"
              required
              options={[
                { value: 'business', label: '사업소득' },
                { value: 'labor', label: '근로·연금소득' },
                { value: 'realestate_rent', label: '부동산 임대소득' },
                { value: 'realestate_sale', label: '부동산 양도소득' },
                { value: 'financial', label: '금융소득 (이자·배당)' },
                { value: 'inheritance', label: '상속·증여' },
                { value: 'asset_transfer', label: '일시 재산양도로 인한 소득' },
              ]}
              values={fundsSource}
              onChange={v => { setFundsSource(v); clearErr('fundsSource') }}
              error={errors.fundsSource}
              otherKey="other"
              otherValue={fundsSourceOther}
              onOtherChange={setFundsSourceOther}
            />
          </Section>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <Button variant="outline" onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex-1">
            <ArrowLeft size={16} /> 이전
          </Button>
        )}
        <Button onClick={handleNext} className="flex-1">
          {step === TOTAL_STEPS - 1 ? '다음 단계로' : '다음'} <ArrowRight size={16} />
        </Button>
      </div>
    </FormShell>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">{label}</p>
      {children}
    </div>
  )
}
