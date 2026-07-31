export const COUNTRY_NAMES: Record<string, string> = {
  KR: '한국',
  CN: '중국',
  HK: '홍콩',
  SG: '싱가포르',
  JP: '일본',
  VN: '베트남',
  US: '미국',
  GB: '영국',
  DE: '독일',
  FR: '프랑스',
  AU: '호주',
  CA: '캐나다',
  IN: '인도',
  ID: '인도네시아',
  MY: '말레이시아',
  TH: '태국',
  PH: '필리핀',
  TW: '대만',
}

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code
}
