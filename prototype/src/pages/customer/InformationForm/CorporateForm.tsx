import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash } from '@phosphor-icons/react'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import RadioGroup from '../../../components/ui/RadioGroup'
import CheckboxGroup from '../../../components/ui/CheckboxGroup'
import Button from '../../../components/ui/Button'
import FormShell from './FormShell'
import { COUNTRIES } from '../../../constants/countries'
import type { ServiceSegment } from '../../../types'

interface Props {
  serviceSegments: ServiceSegment[]
  initialData?: Record<string, unknown>
  onComplete: (data: Record<string, unknown>) => void
  onDraftSave?: (data: Record<string, unknown>) => void
}

type Errors = Record<string, string>

const TOTAL_STEPS = 3

export default function CorporateForm({ onComplete, onDraftSave, initialData }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})

  const d = initialData ?? {}
  const rep1 = (d.rep1 as Record<string, string>) ?? {}
  const rep2 = (d.rep2 as Record<string, string> | null) ?? null
  const bo1 = (d.bo1 as Record<string, string>) ?? {}
  const bo2 = (d.bo2 as Record<string, string> | null) ?? null

  // Section 1 — 기본 정보
  const [companyNameKr, setCompanyNameKr] = useState((d.companyNameKr as string) ?? '')
  const [companyNameEn, setCompanyNameEn] = useState((d.companyNameEn as string) ?? '')
  const [bizRegNo, setBizRegNo] = useState((d.bizRegNo as string) ?? '')
  const [phone, setPhone] = useState((d.phone as string) ?? '')
  const [industry, setIndustry] = useState((d.industry as string) ?? '')
  const [bizType, setBizType] = useState((d.bizType as string) ?? '')
  const [bizAddress, setBizAddress] = useState((d.bizAddress as string) ?? '')
  const [corpType, setCorpType] = useState((d.corpType as string) ?? '')
  const [corpRegNo, setCorpRegNo] = useState((d.corpRegNo as string) ?? '')
  const [corpNationality, setCorpNationality] = useState((d.corpNationality as string) ?? '')
  const [headOfficeAddress, setHeadOfficeAddress] = useState((d.headOfficeAddress as string) ?? '')
  // 대표자 1
  const [rep1NameKr, setRep1NameKr] = useState(rep1.nameKr ?? '')
  const [rep1NameEn, setRep1NameEn] = useState(rep1.nameEn ?? '')
  const [rep1Dob, setRep1Dob] = useState(rep1.dob ?? '')
  const [rep1Gender, setRep1Gender] = useState(rep1.gender ?? '')
  const [rep1Nationality, setRep1Nationality] = useState(rep1.nationality ?? '')
  // 대표자 2 (co-rep)
  const [hasCoRep, setHasCoRep] = useState(rep2 != null)
  const [rep2NameKr, setRep2NameKr] = useState(rep2?.nameKr ?? '')
  const [rep2NameEn, setRep2NameEn] = useState(rep2?.nameEn ?? '')
  const [rep2Dob, setRep2Dob] = useState(rep2?.dob ?? '')
  const [rep2Gender, setRep2Gender] = useState(rep2?.gender ?? '')
  const [rep2Nationality, setRep2Nationality] = useState(rep2?.nationality ?? '')

  // Section 2 — 실제 소유자
  const [boExemptions, setBoExemptions] = useState<string[]>((d.boExemptions as string[]) ?? [])
  const [boStep, setBoStep] = useState((d.boStep as string) ?? '1')
  const [bo1NameKr, setBo1NameKr] = useState(bo1.nameKr ?? '')
  const [bo1NameEn, setBo1NameEn] = useState(bo1.nameEn ?? '')
  const [bo1Dob, setBo1Dob] = useState(bo1.dob ?? '')
  const [bo1Nationality, setBo1Nationality] = useState(bo1.nationality ?? '')
  const [bo1Residence, setBo1Residence] = useState(bo1.residence ?? '')
  const [hasSecondBO, setHasSecondBO] = useState(bo2 != null)
  const [bo2NameKr, setBo2NameKr] = useState(bo2?.nameKr ?? '')
  const [bo2NameEn, setBo2NameEn] = useState(bo2?.nameEn ?? '')
  const [bo2Dob, setBo2Dob] = useState(bo2?.dob ?? '')
  const [bo2Nationality, setBo2Nationality] = useState(bo2?.nationality ?? '')
  const [bo2Residence, setBo2Residence] = useState(bo2?.residence ?? '')

  // Section 3 — 추가 확인
  const [txPurpose, setTxPurpose] = useState((d.txPurpose as string) ?? '')
  const [txPurposeOther, setTxPurposeOther] = useState((d.txPurposeOther as string) ?? '')
  const [isVASP, setIsVASP] = useState((d.isVASP as string) ?? '')
  const [fundsSource, setFundsSource] = useState<string[]>((d.fundsSource as string[]) ?? [])
  const [fundsSourceOther, setFundsSourceOther] = useState((d.fundsSourceOther as string) ?? '')
  const [corpSize, setCorpSize] = useState((d.corpSize as string) ?? '')
  const [listingStatus, setListingStatus] = useState((d.listingStatus as string) ?? '')
  const [listingOther, setListingOther] = useState((d.listingOther as string) ?? '')
  const [establishedDate, setEstablishedDate] = useState((d.establishedDate as string) ?? '')

  function formatBizRegNo(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
  }

  function validate(): boolean {
    const e: Errors = {}
    if (step === 0) {
      if (!companyNameKr.trim()) e.companyNameKr = '필수 항목입니다.'
      if (!companyNameEn.trim()) e.companyNameEn = '필수 항목입니다.'
      if (!bizRegNo.trim()) e.bizRegNo = '필수 항목입니다.'
      if (!phone.trim()) e.phone = '필수 항목입니다.'
      if (!industry.trim()) e.industry = '필수 항목입니다.'
      if (!bizType.trim()) e.bizType = '필수 항목입니다.'
      if (!bizAddress.trim()) e.bizAddress = '필수 항목입니다.'
      if (!corpType) e.corpType = '선택해주세요.'
      if (!corpRegNo.trim()) e.corpRegNo = '필수 항목입니다.'
      if (!corpNationality) e.corpNationality = '선택해주세요.'
      if (!rep1NameKr.trim()) e.rep1NameKr = '필수 항목입니다.'
      if (!rep1NameEn.trim()) e.rep1NameEn = '필수 항목입니다.'
      if (!rep1Dob) e.rep1Dob = '필수 항목입니다.'
      if (!rep1Gender) e.rep1Gender = '선택해주세요.'
      if (!rep1Nationality) e.rep1Nationality = '선택해주세요.'
      if (hasCoRep) {
        if (!rep2NameKr.trim()) e.rep2NameKr = '필수 항목입니다.'
        if (!rep2NameEn.trim()) e.rep2NameEn = '필수 항목입니다.'
        if (!rep2Dob) e.rep2Dob = '필수 항목입니다.'
        if (!rep2Gender) e.rep2Gender = '선택해주세요.'
        if (!rep2Nationality) e.rep2Nationality = '선택해주세요.'
      }
    }
    if (step === 1) {
      const exempt = boExemptions.length > 0
      if (!exempt) {
        if (!bo1NameKr.trim()) e.bo1NameKr = '필수 항목입니다.'
        if (!bo1NameEn.trim()) e.bo1NameEn = '필수 항목입니다.'
        if (!bo1Dob) e.bo1Dob = '필수 항목입니다.'
        if (!bo1Nationality) e.bo1Nationality = '선택해주세요.'
        if (!bo1Residence) e.bo1Residence = '선택해주세요.'
      }
    }
    if (step === 2) {
      if (!txPurpose) e.txPurpose = '선택해주세요.'
      if (!isVASP) e.isVASP = '선택해주세요.'
      if (fundsSource.length === 0) e.fundsSource = '하나 이상 선택해주세요.'
      if (!corpSize) e.corpSize = '선택해주세요.'
      if (!listingStatus) e.listingStatus = '선택해주세요.'
      if (!establishedDate) e.establishedDate = '필수 항목입니다.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function collectCurrentData(): Record<string, unknown> {
    return {
      companyNameKr, companyNameEn, bizRegNo, phone, industry, bizType,
      bizAddress, corpType, corpRegNo, corpNationality, headOfficeAddress,
      rep1: { nameKr: rep1NameKr, nameEn: rep1NameEn, dob: rep1Dob, gender: rep1Gender, nationality: rep1Nationality },
      rep2: hasCoRep ? { nameKr: rep2NameKr, nameEn: rep2NameEn, dob: rep2Dob, gender: rep2Gender, nationality: rep2Nationality } : null,
      boExemptions, boStep,
      bo1: { nameKr: bo1NameKr, nameEn: bo1NameEn, dob: bo1Dob, nationality: bo1Nationality, residence: bo1Residence },
      bo2: hasSecondBO ? { nameKr: bo2NameKr, nameEn: bo2NameEn, dob: bo2Dob, nationality: bo2Nationality, residence: bo2Residence } : null,
      txPurpose, txPurposeOther, isVASP, fundsSource, fundsSourceOther,
      corpSize, listingStatus, listingOther, establishedDate,
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

  const boExempt = boExemptions.length > 0

  return (
    <FormShell
      step={step}
      totalSteps={TOTAL_STEPS}
      titles={['기본 정보', '실제 소유자 확인', '추가 확인사항']}
      onBack={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
      onDraftSave={onDraftSave ? () => onDraftSave(collectCurrentData()) : undefined}
    >
      {/* ── Step 0: 기본 정보 ── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Section label="회사 정보">
            <div className="grid grid-cols-2 gap-4">
              <Input label="회사명 (한글)" required value={companyNameKr} onChange={e => { setCompanyNameKr(e.target.value); clearErr('companyNameKr') }} error={errors.companyNameKr} />
              <Input label="Company Name (English)" required value={companyNameEn} onChange={e => { setCompanyNameEn(e.target.value); clearErr('companyNameEn') }} error={errors.companyNameEn} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="사업자등록번호" required placeholder="000-00-00000" value={bizRegNo} onChange={e => { setBizRegNo(formatBizRegNo(e.target.value)); clearErr('bizRegNo') }} error={errors.bizRegNo} />
              <Input label="연락처" required value={phone} onChange={e => { setPhone(e.target.value); clearErr('phone') }} error={errors.phone} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="업종" required placeholder="예: 소프트웨어 개발" value={industry} onChange={e => { setIndustry(e.target.value); clearErr('industry') }} error={errors.industry} />
              <Input label="업태" required placeholder="예: 서비스업" value={bizType} onChange={e => { setBizType(e.target.value); clearErr('bizType') }} error={errors.bizType} />
            </div>
            <Input label="사업장 주소" required value={bizAddress} onChange={e => { setBizAddress(e.target.value); clearErr('bizAddress') }} error={errors.bizAddress} />
            <div className="grid grid-cols-2 gap-4">
              <RadioGroup label="법인 유형" required options={[{ value: 'profit', label: '영리법인' }, { value: 'nonprofit', label: '비영리법인' }]} value={corpType} onChange={v => { setCorpType(v); clearErr('corpType') }} error={errors.corpType} />
              <Select label="법인 국적" required options={COUNTRIES} placeholder="선택" value={corpNationality} onChange={e => { setCorpNationality(e.target.value); clearErr('corpNationality') }} error={errors.corpNationality} />
            </div>
            <Input label="법인 등록번호" required value={corpRegNo} onChange={e => { setCorpRegNo(e.target.value); clearErr('corpRegNo') }} error={errors.corpRegNo} />
            <Input label="본점 주소 (사업장 주소와 다를 경우)" value={headOfficeAddress} onChange={e => setHeadOfficeAddress(e.target.value)} />
          </Section>

          <Section label="대표자 정보">
            <div className="grid grid-cols-2 gap-4">
              <Input label="성명 (한글)" required value={rep1NameKr} onChange={e => { setRep1NameKr(e.target.value); clearErr('rep1NameKr') }} error={errors.rep1NameKr} />
              <Input label="Name (English)" required value={rep1NameEn} onChange={e => { setRep1NameEn(e.target.value); clearErr('rep1NameEn') }} error={errors.rep1NameEn} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="생년월일" required type="date" value={rep1Dob} onChange={e => { setRep1Dob(e.target.value); clearErr('rep1Dob') }} error={errors.rep1Dob} />
              <RadioGroup label="성별" required options={[{ value: 'M', label: '남' }, { value: 'F', label: '여' }]} value={rep1Gender} onChange={v => { setRep1Gender(v); clearErr('rep1Gender') }} error={errors.rep1Gender} />
              <Select label="국적" required options={COUNTRIES} placeholder="선택" value={rep1Nationality} onChange={e => { setRep1Nationality(e.target.value); clearErr('rep1Nationality') }} error={errors.rep1Nationality} />
            </div>

            <button type="button" onClick={() => setHasCoRep(v => !v)} className="flex items-center gap-1.5 text-[13px] text-sb-brand font-medium mt-1">
              {hasCoRep ? <Trash size={15} /> : <Plus size={15} />}
              {hasCoRep ? '각자대표 삭제' : '각자대표 추가'}
            </button>
            {hasCoRep && (
              <div className="p-4 bg-sb-n50 rounded-[10px] border border-sb-n200 flex flex-col gap-4">
                <p className="text-[13px] font-semibold text-sb-n700">대표자 2</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="성명 (한글)" value={rep2NameKr} onChange={e => setRep2NameKr(e.target.value)} />
                  <Input label="Name (English)" value={rep2NameEn} onChange={e => setRep2NameEn(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="생년월일" type="date" value={rep2Dob} onChange={e => setRep2Dob(e.target.value)} />
                  <RadioGroup label="성별" options={[{ value: 'M', label: '남' }, { value: 'F', label: '여' }]} value={rep2Gender} onChange={setRep2Gender} />
                  <Select label="국적" options={COUNTRIES} placeholder="선택" value={rep2Nationality} onChange={e => setRep2Nationality(e.target.value)} />
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ── Step 1: 실제 소유자 ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Section label="확인 생략 대상">
            <CheckboxGroup
              label="해당 사항 선택 시 실제 소유자 확인이 생략됩니다"
              options={[
                { value: 'gov', label: '국가·지자체' },
                { value: 'public', label: '공공기관' },
                { value: 'fi', label: '금융회사' },
                { value: 'listed', label: '사업보고서 제출대상 법인 (상장회사)' },
              ]}
              values={boExemptions}
              onChange={setBoExemptions}
            />
          </Section>

          {!boExempt && (
            <>
              <Section label="실제 소유자 구분">
                <RadioGroup
                  label="아래 단계 중 해당하는 항목을 선택해주세요"
                  layout="col"
                  options={[
                    { value: '1', label: '1단계 — 25% 이상 지분을 소유한 자연인이 있음' },
                    { value: '2a', label: '2단계 — 최대 지분 소유자' },
                    { value: '2b', label: '2단계 — 대표자·임원 과반수를 선임한 주주' },
                    { value: '2c', label: '2단계 — 법인·단체를 사실상 지배하는 사람' },
                    { value: '3', label: '3단계 — 법인 또는 단체의 대표자' },
                  ]}
                  value={boStep}
                  onChange={setBoStep}
                />
              </Section>

              <Section label="실제 소유자 1">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="성명 (한글)" required value={bo1NameKr} onChange={e => { setBo1NameKr(e.target.value); clearErr('bo1NameKr') }} error={errors.bo1NameKr} />
                  <Input label="Name (English)" required value={bo1NameEn} onChange={e => { setBo1NameEn(e.target.value); clearErr('bo1NameEn') }} error={errors.bo1NameEn} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="생년월일" required type="date" value={bo1Dob} onChange={e => { setBo1Dob(e.target.value); clearErr('bo1Dob') }} error={errors.bo1Dob} />
                  <Select label="국적" required options={COUNTRIES} placeholder="선택" value={bo1Nationality} onChange={e => { setBo1Nationality(e.target.value); clearErr('bo1Nationality') }} error={errors.bo1Nationality} />
                  <Select label="거주국가" required options={COUNTRIES} placeholder="선택" value={bo1Residence} onChange={e => { setBo1Residence(e.target.value); clearErr('bo1Residence') }} error={errors.bo1Residence} />
                </div>

                <button type="button" onClick={() => setHasSecondBO(v => !v)} className="flex items-center gap-1.5 text-[13px] text-sb-brand font-medium mt-1">
                  {hasSecondBO ? <Trash size={15} /> : <Plus size={15} />}
                  {hasSecondBO ? '실제 소유자 2 삭제' : '실제 소유자 2 추가'}
                </button>
                {hasSecondBO && (
                  <div className="p-4 bg-sb-n50 rounded-[10px] border border-sb-n200 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="성명 (한글)" value={bo2NameKr} onChange={e => setBo2NameKr(e.target.value)} />
                      <Input label="Name (English)" value={bo2NameEn} onChange={e => setBo2NameEn(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Input label="생년월일" type="date" value={bo2Dob} onChange={e => setBo2Dob(e.target.value)} />
                      <Select label="국적" options={COUNTRIES} placeholder="선택" value={bo2Nationality} onChange={e => setBo2Nationality(e.target.value)} />
                      <Select label="거주국가" options={COUNTRIES} placeholder="선택" value={bo2Residence} onChange={e => setBo2Residence(e.target.value)} />
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: 추가 확인사항 ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Section label="추가 확인사항">
            <RadioGroup
              label="거래목적"
              required
              layout="col"
              options={[
                { value: 'settlement', label: '판매대금 정산대행' },
                { value: 'other', label: '기타' },
              ]}
              value={txPurpose}
              onChange={v => { setTxPurpose(v); clearErr('txPurpose') }}
              error={errors.txPurpose}
            />
            {txPurpose === 'other' && (
              <Input placeholder="거래 목적을 입력해주세요" value={txPurposeOther} onChange={e => setTxPurposeOther(e.target.value)} />
            )}

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
              otherPlaceholder="기타 자금 원천"
            />

            <div className="grid grid-cols-2 gap-4">
              <RadioGroup
                label="법인구분"
                required
                options={[{ value: 'large', label: '대기업' }, { value: 'sme', label: '중소기업' }]}
                value={corpSize}
                onChange={v => { setCorpSize(v); clearErr('corpSize') }}
                error={errors.corpSize}
              />
              <Select
                label="상장정보"
                required
                options={[
                  { value: 'unlisted', label: '비상장' },
                  { value: 'kospi', label: '유가증권시장 (코스피)' },
                  { value: 'kosdaq', label: '코스닥' },
                  { value: 'other', label: '기타' },
                ]}
                placeholder="선택"
                value={listingStatus}
                onChange={e => { setListingStatus(e.target.value); clearErr('listingStatus') }}
                error={errors.listingStatus}
              />
            </div>
            {listingStatus === 'other' && (
              <Input placeholder="상장 정보를 입력해주세요" value={listingOther} onChange={e => setListingOther(e.target.value)} />
            )}
            <Input label="설립일자" required type="date" value={establishedDate} onChange={e => { setEstablishedDate(e.target.value); clearErr('establishedDate') }} error={errors.establishedDate} />
          </Section>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <Button variant="outline" onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex-1">
            <ArrowLeft size={16} /> 이전
          </Button>
        )}
        <Button onClick={handleNext} className="flex-1">
          {step === TOTAL_STEPS - 1 ? '다음 단계로' : '다음'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </FormShell>
  )

  function clearErr(k: string) { setErrors(e => ({ ...e, [k]: undefined as unknown as string })) }
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">{label}</p>
      {children}
    </div>
  )
}
