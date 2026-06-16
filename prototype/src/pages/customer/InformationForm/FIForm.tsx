import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Trash } from '@phosphor-icons/react'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import RadioGroup from '../../../components/ui/RadioGroup'
import CheckboxGroup from '../../../components/ui/CheckboxGroup'
import Textarea from '../../../components/ui/Textarea'
import Button from '../../../components/ui/Button'
import FormShell from './FormShell'
import { COUNTRIES } from '../../../constants/countries'
import type { ServiceSegment } from '../../../types'

interface Props {
  serviceSegments: ServiceSegment[]
  onComplete: (data: Record<string, unknown>) => void
  onDraftSave?: (data: Record<string, unknown>) => void
}

type Errors = Record<string, string>
const TOTAL_STEPS = 4

interface PersonEntry { nameKr: string; nameEn: string; nationality: string; dob: string; passportNo: string; extra?: string }
const BLANK_PERSON: PersonEntry = { nameKr: '', nameEn: '', nationality: '', dob: '', passportNo: '' }

export default function FIForm({ onComplete, onDraftSave }: Props) {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})

  // Section A — Basic Info
  const [legalName, setLegalName] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [incorpDate, setIncorpDate] = useState('')
  const [incorpCountry, setIncorpCountry] = useState('')
  const [regNo, setRegNo] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [website, setWebsite] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [principalAddress, setPrincipalAddress] = useState('')
  const [domesticBranches, setDomesticBranches] = useState('')
  const [foreignBranches, setForeignBranches] = useState('')
  const [licenseAuthority, setLicenseAuthority] = useState('')
  const [licenseType, setLicenseType] = useState('')
  const [licenseIssued, setLicenseIssued] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [auditors, setAuditors] = useState('')
  const [taxStatus, setTaxStatus] = useState('')
  const [repName, setRepName] = useState('')
  const [repDob, setRepDob] = useState('')
  const [repPhone, setRepPhone] = useState('')
  const [repEmail, setRepEmail] = useState('')
  const [industryType, setIndustryType] = useState('')

  // Section B — Services
  const [services, setServices] = useState<string[]>([])
  const [collectionCurrencies, setCollectionCurrencies] = useState<string[]>([])
  const [txPurposes, setTxPurposes] = useState('')
  const [originCountries, setOriginCountries] = useState('')
  const [hasUpstreamFI, setHasUpstreamFI] = useState('')
  const [upstreamLayers, setUpstreamLayers] = useState('')
  const [hasUnlicensedFI, setHasUnlicensedFI] = useState('')
  const [upstreamOriginCountries, setUpstreamOriginCountries] = useState('')
  const [isVASP, setIsVASP] = useState('')

  // Section C — Source of Funds
  const [fundsSource, setFundsSource] = useState<string[]>([])
  const [fundsOther, setFundsOther] = useState('')

  // Section D — Ownership
  const [parentName, setParentName] = useState('')
  const [parentAddress, setParentAddress] = useState('')
  const [parentRelationship, setParentRelationship] = useState('')
  const [parentJurisdiction, setParentJurisdiction] = useState('')
  const [parentListed, setParentListed] = useState('')
  const [parentListedWhere, setParentListedWhere] = useState('')
  const [owners, setOwners] = useState<PersonEntry[]>([{ ...BLANK_PERSON, extra: '' }])
  const [directors, setDirectors] = useState<PersonEntry[]>([{ ...BLANK_PERSON, extra: '' }])
  const [hasBankruptcy, setHasBankruptcy] = useState('')
  const [bankruptcyDetails, setBankruptcyDetails] = useState('')

  // Section E — Legal / AML
  const [products, setProducts] = useState('')
  const [noShellPolicy, setNoShellPolicy] = useState('')
  const [fatfPresence, setFatfPresence] = useState('')
  const [amlPenalty, setAmlPenalty] = useState('')
  const [amlPenaltyDetails, setAmlPenaltyDetails] = useState('')
  const [criminalProceedings, setCriminalProceedings] = useState('')
  const [criminalDetails, setCriminalDetails] = useState('')
  const [pendingLitigation, setPendingLitigation] = useState('')
  const [litigationDetails, setLitigationDetails] = useState('')

  // Section F — Compliance
  const POLICY_TOPICS = ['Anti-Bribery & Corruption', 'AML', 'Business Continuity', 'Data Protection', 'Information Security', 'Risk Management']
  const [policies, setPolicies] = useState<Record<string, string>>({})
  const [training, setTraining] = useState<Record<string, string>>({})

  function clearErr(k: string) { setErrors(e => ({ ...e, [k]: undefined as unknown as string })) }

  function validate(): boolean {
    const e: Errors = {}
    if (step === 0) {
      if (!legalName.trim()) e.legalName = '필수 항목입니다.'
      if (!legalForm.trim()) e.legalForm = '필수 항목입니다.'
      if (!incorpDate) e.incorpDate = '필수 항목입니다.'
      if (!incorpCountry) e.incorpCountry = '선택해주세요.'
      if (!regNo.trim()) e.regNo = '필수 항목입니다.'
      if (!website.trim()) e.website = '필수 항목입니다.'
      if (!regAddress.trim()) e.regAddress = '필수 항목입니다.'
      if (!licenseAuthority.trim()) e.licenseAuthority = '필수 항목입니다.'
      if (!licenseType.trim()) e.licenseType = '필수 항목입니다.'
      if (!repName.trim()) e.repName = '필수 항목입니다.'
      if (!repDob) e.repDob = '필수 항목입니다.'
    }
    if (step === 1) {
      if (services.length === 0) e.services = '하나 이상 선택해주세요.'
      if (!txPurposes.trim()) e.txPurposes = '필수 항목입니다.'
      if (!hasUpstreamFI) e.hasUpstreamFI = '선택해주세요.'
      if (!isVASP) e.isVASP = '선택해주세요.'
    }
    if (step === 2) {
      if (fundsSource.length === 0) e.fundsSource = '하나 이상 선택해주세요.'
      if (!parentName.trim()) e.parentName = '필수 항목입니다.'
    }
    if (step === 3) {
      if (!products.trim()) e.products = '필수 항목입니다.'
      if (!noShellPolicy) e.noShellPolicy = '선택해주세요.'
      if (!fatfPresence) e.fatfPresence = '선택해주세요.'
      if (!amlPenalty) e.amlPenalty = '선택해주세요.'
      if (!criminalProceedings) e.criminalProceedings = '선택해주세요.'
      if (!pendingLitigation) e.pendingLitigation = '선택해주세요.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function collectCurrentData(): Record<string, unknown> {
    return {
      legalName, legalForm, incorpDate, incorpCountry, regNo, tradeName, website,
      regAddress, principalAddress, domesticBranches, foreignBranches,
      licenseAuthority, licenseType, licenseIssued, licenseExpiry,
      auditors, taxStatus, repName, repDob, repPhone, repEmail, industryType,
      services, collectionCurrencies, txPurposes, originCountries,
      hasUpstreamFI, upstreamLayers, hasUnlicensedFI, upstreamOriginCountries, isVASP,
      fundsSource, fundsOther,
      parentName, parentAddress, parentRelationship, parentJurisdiction,
      parentListed, parentListedWhere, owners, directors, hasBankruptcy, bankruptcyDetails,
      products, noShellPolicy, fatfPresence,
      amlPenalty, amlPenaltyDetails, criminalProceedings, criminalDetails,
      pendingLitigation, litigationDetails, policies, training,
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

  const yesNo = [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }]

  return (
    <FormShell
      step={step}
      totalSteps={TOTAL_STEPS}
      titles={['기본 정보 (Section A)', '서비스 및 거래 (Section B)', '자금원천 및 소유구조 (Section C·D)', '법률·컴플라이언스 (Section E·F)']}
      onBack={() => step === 0 ? history.back() : setStep(s => s - 1)}
      onDraftSave={onDraftSave ? () => onDraftSave(collectCurrentData()) : undefined}
    >
      {/* ── Step 0: Section A ── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Section label="법인 기본 정보">
            <Input label="등록 법인명 (Legal Name)" required value={legalName} onChange={e => { setLegalName(e.target.value); clearErr('legalName') }} error={errors.legalName} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="법인 형태 (e.g. Stock Corporation)" required value={legalForm} onChange={e => { setLegalForm(e.target.value); clearErr('legalForm') }} error={errors.legalForm} />
              <Input label="상호명 / 이전 명칭 (있을 경우)" value={tradeName} onChange={e => setTradeName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="설립일" required type="date" value={incorpDate} onChange={e => { setIncorpDate(e.target.value); clearErr('incorpDate') }} error={errors.incorpDate} />
              <Select label="설립 국가" required options={COUNTRIES} placeholder="선택" value={incorpCountry} onChange={e => { setIncorpCountry(e.target.value); clearErr('incorpCountry') }} error={errors.incorpCountry} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="등록번호" required value={regNo} onChange={e => { setRegNo(e.target.value); clearErr('regNo') }} error={errors.regNo} />
              <Input label="웹사이트" required placeholder="https://" value={website} onChange={e => { setWebsite(e.target.value); clearErr('website') }} error={errors.website} />
            </div>
            <Input label="등록 주소 (Registered Address)" required value={regAddress} onChange={e => { setRegAddress(e.target.value); clearErr('regAddress') }} error={errors.regAddress} />
            <Input label="주요 사업장 주소 (등록 주소와 다를 경우)" value={principalAddress} onChange={e => setPrincipalAddress(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="국내 지점 수" inputMode="numeric" placeholder="0" value={domesticBranches} onChange={e => setDomesticBranches(e.target.value)} />
              <Input label="해외 지점 수" inputMode="numeric" placeholder="0" value={foreignBranches} onChange={e => setForeignBranches(e.target.value)} />
            </div>
          </Section>

          <Section label="인허가 정보">
            <Input label="인허가 기관 및 관할 국가" required value={licenseAuthority} onChange={e => { setLicenseAuthority(e.target.value); clearErr('licenseAuthority') }} error={errors.licenseAuthority} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="라이선스 유형" required value={licenseType} onChange={e => { setLicenseType(e.target.value); clearErr('licenseType') }} error={errors.licenseType} />
              <Input label="발급일" type="date" value={licenseIssued} onChange={e => setLicenseIssued(e.target.value)} />
              <Input label="만료일" type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="외부 감사인 명칭" value={auditors} onChange={e => setAuditors(e.target.value)} />
              <RadioGroup label="납세 상태" options={[{ value: 'taxable', label: '납세 대상' }, { value: 'exempt', label: '면세' }]} value={taxStatus} onChange={setTaxStatus} />
            </div>
            <Input label="업종" value={industryType} onChange={e => setIndustryType(e.target.value)} />
          </Section>

          <Section label="대표자 정보">
            <div className="grid grid-cols-2 gap-4">
              <Input label="대표자 성명" required value={repName} onChange={e => { setRepName(e.target.value); clearErr('repName') }} error={errors.repName} />
              <Input label="생년월일" required type="date" value={repDob} onChange={e => { setRepDob(e.target.value); clearErr('repDob') }} error={errors.repDob} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="연락처" value={repPhone} onChange={e => setRepPhone(e.target.value)} />
              <Input label="이메일" type="email" value={repEmail} onChange={e => setRepEmail(e.target.value)} />
            </div>
          </Section>
        </div>
      )}

      {/* ── Step 1: Section B ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Section label="SentBe 이용 서비스">
            <CheckboxGroup
              label="이용하실 서비스를 선택해주세요"
              required
              options={[{ value: 'collection', label: 'Collection (수금)' }, { value: 'payout', label: 'Payout (송금)' }]}
              values={services}
              onChange={v => { setServices(v); clearErr('services') }}
              error={errors.services}
              layout="row"
            />
            {services.includes('collection') && (
              <CheckboxGroup
                label="수금 통화"
                options={[{ value: 'KRW', label: 'KRW (한국)' }, { value: 'VND', label: 'VND (베트남)' }]}
                values={collectionCurrencies}
                onChange={setCollectionCurrencies}
                layout="row"
              />
            )}
            <Textarea
              label="거래 목적 (상위 5개 이상 기재)"
              required
              placeholder="Payout / Collection 각각 기재"
              value={txPurposes}
              onChange={e => { setTxPurposes(e.target.value); clearErr('txPurposes') }}
              rows={3}
            />
            <Textarea
              label="Payout 거래의 발신 국가"
              placeholder="해당 국가를 모두 기재해주세요"
              value={originCountries}
              onChange={e => setOriginCountries(e.target.value)}
              rows={2}
            />
          </Section>

          <Section label="Upstream FI 여부">
            <RadioGroup
              label="Upstream FI / MSB / PSP 등 기관 클라이언트의 거래를 처리합니까?"
              required
              options={yesNo}
              value={hasUpstreamFI}
              onChange={v => { setHasUpstreamFI(v); clearErr('hasUpstreamFI') }}
              error={errors.hasUpstreamFI}
            />
            {hasUpstreamFI === 'yes' && (
              <div className="flex flex-col gap-4 p-4 bg-sb-n50 rounded-[10px] border border-sb-n200">
                <Input label="Nesting 단계 수" inputMode="numeric" placeholder="1" value={upstreamLayers} onChange={e => setUpstreamLayers(e.target.value)} />
                <RadioGroup label="미인가 FI / PSP / MSB와 거래합니까?" options={yesNo} value={hasUnlicensedFI} onChange={setHasUnlicensedFI} />
                <Textarea label="Upstream 클라이언트 발신 국가" value={upstreamOriginCountries} onChange={e => setUpstreamOriginCountries(e.target.value)} rows={2} />
              </div>
            )}
          </Section>

          <Section label="가상자산 (VASP)">
            <RadioGroup
              label="귀사는 가상자산취급업소(VASP)입니까?"
              required
              options={yesNo}
              value={isVASP}
              onChange={v => { setIsVASP(v); clearErr('isVASP') }}
              error={errors.isVASP}
            />
          </Section>
        </div>
      )}

      {/* ── Step 2: Section C + D ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Section label="자금 및 재산 원천 (Section C)">
            <CheckboxGroup
              label="해당 항목을 모두 선택해주세요"
              required
              options={[
                { value: 'capital', label: 'Capital Injection' },
                { value: 'investments', label: 'Liquid Investments' },
                { value: 'profits', label: 'Profits' },
              ]}
              values={fundsSource}
              onChange={v => { setFundsSource(v); clearErr('fundsSource') }}
              error={errors.fundsSource}
              otherKey="other"
              otherValue={fundsOther}
              onOtherChange={setFundsOther}
              otherPlaceholder="기타 자금 원천"
            />
          </Section>

          <Section label="모회사 정보 (Section D)">
            <Input label="모회사 / 최종 지배회사 명칭" required value={parentName} onChange={e => { setParentName(e.target.value); clearErr('parentName') }} error={errors.parentName} />
            <Input label="모회사 주소" value={parentAddress} onChange={e => setParentAddress(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="모회사와의 관계"
                options={[
                  { value: 'branch', label: 'Branch' },
                  { value: 'subsidiary', label: 'Subsidiary' },
                  { value: 'agency', label: 'Agency' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="선택"
                value={parentRelationship}
                onChange={e => setParentRelationship(e.target.value)}
              />
              <Input label="모회사 감독 관할 국가" value={parentJurisdiction} onChange={e => setParentJurisdiction(e.target.value)} />
            </div>
            <RadioGroup label="모회사 상장 여부" options={yesNo} value={parentListed} onChange={setParentListed} />
            {parentListed === 'yes' && <Input label="상장 거래소 및 티커" placeholder="예: NYSE / ACME" value={parentListedWhere} onChange={e => setParentListedWhere(e.target.value)} />}
          </Section>

          <Section label="25%+ 지분 소유자">
            {owners.map((o, i) => (
              <div key={i} className="p-4 bg-sb-n50 rounded-[10px] border border-sb-n200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-sb-n700">Owner {i + 1}</p>
                  {i > 0 && (
                    <button type="button" onClick={() => setOwners(prev => prev.filter((_, j) => j !== i))} className="text-sb-n400 hover:text-sb-negative">
                      <Trash size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="성명 (Korean/English)" value={o.nameEn} onChange={e => setOwners(prev => prev.map((x, j) => j === i ? { ...x, nameEn: e.target.value } : x))} />
                  <Input label="국적" value={o.nationality} onChange={e => setOwners(prev => prev.map((x, j) => j === i ? { ...x, nationality: e.target.value } : x))} />
                  <Input label="생년월일" type="date" value={o.dob} onChange={e => setOwners(prev => prev.map((x, j) => j === i ? { ...x, dob: e.target.value } : x))} />
                  <Input label="여권번호" value={o.passportNo} onChange={e => setOwners(prev => prev.map((x, j) => j === i ? { ...x, passportNo: e.target.value } : x))} />
                </div>
                <Input label="지분율 (%)" inputMode="numeric" value={o.extra ?? ''} onChange={e => setOwners(prev => prev.map((x, j) => j === i ? { ...x, extra: e.target.value } : x))} />
              </div>
            ))}
            <button type="button" onClick={() => setOwners(prev => [...prev, { ...BLANK_PERSON, extra: '' }])} className="flex items-center gap-1.5 text-[13px] text-sb-brand font-medium">
              <Plus size={15} /> 소유자 추가
            </button>
          </Section>

          <Section label="이사진">
            {directors.map((d, i) => (
              <div key={i} className="p-4 bg-sb-n50 rounded-[10px] border border-sb-n200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-sb-n700">Director {i + 1}</p>
                  {i > 0 && (
                    <button type="button" onClick={() => setDirectors(prev => prev.filter((_, j) => j !== i))} className="text-sb-n400 hover:text-sb-negative">
                      <Trash size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="성명" value={d.nameEn} onChange={e => setDirectors(prev => prev.map((x, j) => j === i ? { ...x, nameEn: e.target.value } : x))} />
                  <Input label="국적" value={d.nationality} onChange={e => setDirectors(prev => prev.map((x, j) => j === i ? { ...x, nationality: e.target.value } : x))} />
                  <Input label="생년월일" type="date" value={d.dob} onChange={e => setDirectors(prev => prev.map((x, j) => j === i ? { ...x, dob: e.target.value } : x))} />
                  <Input label="여권번호" value={d.passportNo} onChange={e => setDirectors(prev => prev.map((x, j) => j === i ? { ...x, passportNo: e.target.value } : x))} />
                </div>
                <Input label="재직 기간 (년)" inputMode="numeric" value={d.extra ?? ''} onChange={e => setDirectors(prev => prev.map((x, j) => j === i ? { ...x, extra: e.target.value } : x))} />
              </div>
            ))}
            <button type="button" onClick={() => setDirectors(prev => [...prev, { ...BLANK_PERSON, extra: '' }])} className="flex items-center gap-1.5 text-[13px] text-sb-brand font-medium">
              <Plus size={15} /> 이사 추가
            </button>
          </Section>

          <Section label="파산 이력">
            <RadioGroup
              label="현재 또는 전 임원·이사가 파산 신청한 이력이 있습니까?"
              required
              options={yesNo}
              value={hasBankruptcy}
              onChange={setHasBankruptcy}
            />
            {hasBankruptcy === 'yes' && <Textarea label="상세 내용" value={bankruptcyDetails} onChange={e => setBankruptcyDetails(e.target.value)} rows={3} />}
          </Section>
        </div>
      )}

      {/* ── Step 3: Section E + F ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <Section label="주요 금융상품 및 서비스 (Section E)">
            <Textarea
              label="주요 금융상품·서비스 및 지리적 시장 범위"
              required
              value={products}
              onChange={e => { setProducts(e.target.value); clearErr('products') }}
              rows={3}
              error={errors.products}
            />
            <RadioGroup
              label="Shell company와의 거래를 금지하는 정책이 있습니까?"
              required
              options={yesNo}
              value={noShellPolicy}
              onChange={v => { setNoShellPolicy(v); clearErr('noShellPolicy') }}
              error={errors.noShellPolicy}
            />
            <RadioGroup
              label="FATF 블랙리스트/그레이리스트 관할권에 지점·자회사 등이 있습니까?"
              required
              options={yesNo}
              value={fatfPresence}
              onChange={v => { setFatfPresence(v); clearErr('fatfPresence') }}
              error={errors.fatfPresence}
            />
            <RadioGroup
              label="AML 위반으로 행정·금전적 제재를 받은 이력이 있습니까?"
              required
              options={yesNo}
              value={amlPenalty}
              onChange={v => { setAmlPenalty(v); clearErr('amlPenalty') }}
              error={errors.amlPenalty}
            />
            {amlPenalty === 'yes' && <Textarea label="상세 내용" value={amlPenaltyDetails} onChange={e => setAmlPenaltyDetails(e.target.value)} rows={3} />}
            <RadioGroup
              label="형사·행정 소송 또는 조사가 진행 중이거나 이력이 있습니까?"
              required
              options={yesNo}
              value={criminalProceedings}
              onChange={v => { setCriminalProceedings(v); clearErr('criminalProceedings') }}
              error={errors.criminalProceedings}
            />
            {criminalProceedings === 'yes' && <Textarea label="상세 내용" value={criminalDetails} onChange={e => setCriminalDetails(e.target.value)} rows={3} />}
            <RadioGroup
              label="현재 진행 중인 소송·조사가 있습니까?"
              required
              options={yesNo}
              value={pendingLitigation}
              onChange={v => { setPendingLitigation(v); clearErr('pendingLitigation') }}
              error={errors.pendingLitigation}
            />
            {pendingLitigation === 'yes' && <Textarea label="상세 내용" value={litigationDetails} onChange={e => setLitigationDetails(e.target.value)} rows={3} />}
          </Section>

          <Section label="컴플라이언스 정책 및 교육 (Section F)">
            <p className="text-[13px] text-sb-n600">서면 정책 보유 여부</p>
            <div className="flex flex-col gap-2">
              {POLICY_TOPICS.map(t => (
                <div key={t} className="flex items-center justify-between py-2 border-b border-sb-n100 last:border-0">
                  <span className="text-[14px] text-sb-n800">{t}</span>
                  <RadioGroup
                    options={yesNo}
                    value={policies[t] ?? ''}
                    onChange={v => setPolicies(prev => ({ ...prev, [t]: v }))}
                    layout="row"
                  />
                </div>
              ))}
            </div>
            <p className="text-[13px] text-sb-n600 mt-2">직원 교육 실시 여부</p>
            <div className="flex flex-col gap-2">
              {POLICY_TOPICS.map(t => (
                <div key={t} className="flex items-center justify-between py-2 border-b border-sb-n100 last:border-0">
                  <span className="text-[14px] text-sb-n800">{t}</span>
                  <RadioGroup
                    options={yesNo}
                    value={training[t] ?? ''}
                    onChange={v => setTraining(prev => ({ ...prev, [t]: v }))}
                    layout="row"
                  />
                </div>
              ))}
            </div>
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
