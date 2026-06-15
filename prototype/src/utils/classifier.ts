const KOREA_KEYWORDS = ['한국', '대한민국', 'korea', 'kr', 'south korea']

function isKorea(country: string): boolean {
  return KOREA_KEYWORDS.some((k) => country.toLowerCase().includes(k))
}

export type EntitySegment = 'SentBiz Corporate' | 'SentBiz Individual' | 'FI'
export type ServiceSegment = 'KRW Collection' | 'VND Collection' | '기타 Collection'

export function classifyEntity(businessType: string, foundingCountry: string): EntitySegment {
  if (businessType === 'financial') return 'FI'
  if (!isKorea(foundingCountry)) return 'FI'
  return businessType === 'corporation' ? 'SentBiz Corporate' : 'SentBiz Individual'
}

export function classifyServices(
  services: string[],
  collectionCountries: string[]
): ServiceSegment[] {
  if (!services.includes('collection')) return []
  const result: ServiceSegment[] = []
  if (collectionCountries.includes('KRW')) result.push('KRW Collection')
  if (collectionCountries.includes('VND')) result.push('VND Collection')
  if (collectionCountries.includes('OTHER')) result.push('기타 Collection')
  return result
}
