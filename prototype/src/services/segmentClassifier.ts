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

export function classifyServices(services: string[], collectionCountries: string[]): ServiceCode[] {
  const rules = getRuleSet().serviceClassificationRules
  const result: ServiceCode[] = []
  for (const rule of rules) {
    const serviceMatch = rule.triggerServices.every(s => services.includes(s))
    if (!serviceMatch) continue
    if (rule.triggerCurrencies.length > 0) {
      const currencyMatch = rule.triggerCurrencies.some(c => collectionCountries.includes(c))
      if (!currencyMatch) continue
    }
    result.push(rule.serviceCode)
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
