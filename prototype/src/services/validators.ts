export function validateKrBizRegNo(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, '')
  if (!digits) return null
  if (digits.length !== 10) return '사업자등록번호는 숫자 10자리입니다.'
  return null
}

export function validateKrCorpRegNo(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, '')
  if (!digits) return null
  if (digits.length !== 13) return '법인등록번호는 숫자 13자리입니다.'
  return null
}

export function validateDate(value: string): string | null {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'YYYY-MM-DD 형식으로 입력해주세요.'
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return '올바른 날짜가 아닙니다.'
  }
  return null
}
