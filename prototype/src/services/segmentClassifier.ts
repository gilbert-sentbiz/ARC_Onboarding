import type { EntityCode, ServiceCode, SectorCode, SegmentInfo, OnboardingFormData } from '../types'

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
  if (businessType === 'financial') return 'ENTITY_FI'
  if (foundingCountry && !isKorea(foundingCountry)) return 'ENTITY_FI'
  return businessType === 'corporation' ? 'ENTITY_CORP' : 'ENTITY_INDIV'
}

export function classifyServices(services: string[], collectionCountries: string[]): ServiceCode[] {
  const result: ServiceCode[] = []
  if (services.includes('remittance')) result.push('SVC_REMITTANCE')
  if (services.includes('collection')) {
    if (collectionCountries.includes('KRW')) result.push('SVC_KRW')
    if (collectionCountries.includes('VND')) result.push('SVC_VND')
    if (collectionCountries.includes('OTHER')) result.push('SVC_OTHER_COLL')
  }
  return result
}

// Extracts SectorCodes from second-intake data (KRW collection sector)
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
