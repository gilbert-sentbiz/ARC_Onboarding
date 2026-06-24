import type { EntitySegment, ServiceSegment, SegmentInfo, OnboardingFormData } from '../types'

const KOREA_KEYWORDS = ['한국', '대한민국', 'korea', 'kr', 'south korea']

function isKorea(country: string): boolean {
  return KOREA_KEYWORDS.some(k => country.toLowerCase().includes(k))
}

export function classifyEntity(businessType: string, foundingCountry: string): EntitySegment {
  if (businessType === 'financial') return 'FI'
  if (foundingCountry && !isKorea(foundingCountry)) return 'FI'
  return businessType === 'corporation' ? 'SentBiz Corporate' : 'SentBiz Individual'
}

export function classifyServices(services: string[], collectionCountries: string[]): ServiceSegment[] {
  const result: ServiceSegment[] = []
  if (services.includes('remittance')) result.push('Remittance')
  if (services.includes('collection')) {
    if (collectionCountries.includes('KRW')) result.push('KRW Collection')
    if (collectionCountries.includes('VND')) result.push('VND Collection')
    if (collectionCountries.includes('OTHER')) result.push('기타 Collection')
  }
  return result
}

export function classify(formData: OnboardingFormData): SegmentInfo {
  const entitySegment = classifyEntity(formData.businessType, formData.foundingCountry)
  const serviceSegments = classifyServices(formData.services, formData.collectionCountries)

  return {
    entitySegment,
    serviceSegments,
    foundingCountry: formData.foundingCountry,
    monthlyVolumeCurrency: formData.monthlyVolumeCurrency,
    monthlyVolume: formData.monthlyVolume,
    monthlyCount: formData.monthlyCount,
  }
}
