import type { EntityCode, ServiceCode, SectorCode, SegmentInfo, OnboardingFormData } from '../types'
import { getRuleSet } from '../store/ruleStore'

// Normalize legacy free-text Korea inputs (pre-E2) to canonical 'KR'
const LEGACY_KOREA_PATTERNS = ['한국', '대한민국', 'korea', 'south korea']
function normalizeLegacyCountry(country: string): string {
  if (!country) return country
  const lower = country.toLowerCase()
  if (lower === 'kr' || LEGACY_KOREA_PATTERNS.some(p => lower.includes(p))) return 'KR'
  return country
}

const SECTOR_CODE_MAP: Record<string, SectorCode> = {
  trading_b2b: 'SEC_TRADING_B2B',
  trading_b2c: 'SEC_TRADING_B2C',
  consulting:  'SEC_CONSULTING',
  dev_design:  'SEC_DEV_DESIGN',
  advertising: 'SEC_ADVERTISING',
  research:    'SEC_RESEARCH',
  it_computer: 'SEC_IT_COMPUTER',
  coupang:     'SEC_COUPANG',
}

export function classifyEntity(businessType: string, foundingCountry: string): EntityCode {
  const country = normalizeLegacyCountry(foundingCountry)
  const rules = [...getRuleSet().entityClassificationRules].sort((a, b) => a.priority - b.priority)
  for (const rule of rules) {
    const results = rule.conditions.map(c => {
      const val = c.field === 'businessType' ? businessType : country
      // neq on empty value treated as "unknown" — do not fire
      if (c.op === 'neq' && !val) return false
      return c.op === 'eq' ? val === c.value : val !== c.value
    })
    const match = rule.conditionLogic === 'OR' ? results.some(Boolean) : results.every(Boolean)
    if (match) return rule.result
  }
  return 'ENTITY_INDIV'
}

// Normalize legacy currency-code collection values to country codes (pre-S2 form)
const LEGACY_COLLECTION_COUNTRY: Record<string, string> = { KRW: 'KR', VND: 'VN' }

export function classifyServices(services: string[], collectionCountries: string[]): ServiceCode[] {
  const normalized = collectionCountries.map(c => LEGACY_COLLECTION_COUNTRY[c] ?? c)
  const rules = getRuleSet().serviceClassificationRules
  const result: ServiceCode[] = []
  for (const rule of rules) {
    const serviceMatch = rule.triggerServices.every(s => services.includes(s))
    if (!serviceMatch) continue
    if (rule.triggerCountries.length > 0) {
      const countryMatch = rule.triggerCountries.some(c => normalized.includes(c))
      if (!countryMatch) continue
    }
    result.push(rule.serviceCode)
  }
  // SVC_ETC fallback: collection selected but country is 'OTHER' or unregistered
  if (services.includes('collection') && normalized.length > 0) {
    const registeredCountries = new Set(
      rules
        .filter(r => r.triggerServices.includes('collection') && r.triggerCountries.length > 0)
        .flatMap(r => r.triggerCountries)
    )
    const hasEtc = normalized.some(c => c === 'OTHER' || !registeredCountries.has(c))
    if (hasEtc && !result.includes('SVC_ETC')) result.push('SVC_ETC')
  }
  return result
}

export function classifySectors(secondIntakeData?: Record<string, unknown>): SectorCode[] {
  const krwData = secondIntakeData?.krwCollection as Record<string, unknown> | undefined
  const sectorKey = krwData?.sector as string | undefined
  if (!sectorKey) return []
  const code = SECTOR_CODE_MAP[sectorKey]
  return code ? [code] : []
}

export function classify(formData: OnboardingFormData): SegmentInfo {
  const entity = classifyEntity(formData.businessType, formData.foundingCountry)
  const services = classifyServices(formData.services, formData.collectionCountries)

  return {
    entity,
    services,
    sectors: [],
    foundingCountry: formData.foundingCountry,
    monthlyVolumeCurrency: formData.monthlyVolumeCurrency,
    monthlyVolume: formData.monthlyVolume,
    monthlyCount: formData.monthlyCount,
  }
}
