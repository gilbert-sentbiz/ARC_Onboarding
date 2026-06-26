import type { EntityCode, ServiceCode, SectorCode, SegmentInfo, OnboardingFormData } from '../types'
import { getRuleSet } from '../store/ruleStore'

const KOREA_KEYWORDS = ['한국', '대한민국', 'korea', 'kr', 'south korea']

function isKorea(country: string): boolean {
  return KOREA_KEYWORDS.some(k => country.toLowerCase().includes(k))
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
  const rules = getRuleSet().entityClassificationRules
  for (const rule of rules) {
    if (rule.conditionType === 'default') continue
    if (rule.conditionType === 'businessType' && businessType === rule.conditionValue) return rule.result
    if (rule.conditionType === 'isForeignFounding' && foundingCountry && !isKorea(foundingCountry)) return rule.result
  }
  const defaultRule = rules.find(r => r.conditionType === 'default')
  return defaultRule?.result ?? 'ENTITY_INDIV'
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
