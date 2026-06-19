import type { EntitySegment, ServiceSegment, ComplianceRisk, SegmentInfo, OnboardingFormData } from '../types'

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

// FI 또는 기타 국가 수금이면 HIGH, 일반 수금이면 MEDIUM, 송금만이면 LOW
export function classifyComplianceRisk(entity: EntitySegment, services: ServiceSegment[]): ComplianceRisk {
  if (entity === 'FI') return 'HIGH'
  if (services.includes('기타 Collection')) return 'HIGH'
  if (services.some(s => s.includes('Collection'))) return 'MEDIUM'
  return 'LOW'
}

export function classify(formData: OnboardingFormData): SegmentInfo {
  const entitySegment = classifyEntity(formData.businessType, formData.foundingCountry)
  const serviceSegments = classifyServices(formData.services, formData.collectionCountries)
  const complianceRisk = classifyComplianceRisk(entitySegment, serviceSegments)

  return {
    entitySegment,
    serviceSegments,
    foundingCountry: formData.foundingCountry,
    monthlyVolumeCurrency: formData.monthlyVolumeCurrency,
    monthlyVolume: formData.monthlyVolume,
    monthlyCount: formData.monthlyCount,
    complianceRisk,
  }
}
