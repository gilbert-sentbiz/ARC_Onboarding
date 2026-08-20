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

// E.164 range: 7–15 digits (country code included)
export function validatePhone(value: string): string | null {
  if (!value) return null
  if (/[^0-9+\-\s()]/.test(value)) return '숫자, +, -, 공백만 입력할 수 있습니다.'
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7) return '전화번호는 최소 7자리입니다.'
  if (digits.length > 15) return '전화번호는 최대 15자리입니다.'
  return null
}

export function validateEmail(value: string): string | null {
  if (!value) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
    return '올바른 이메일 형식이 아닙니다. (예: name@company.com)'
  return null
}

export function validateUrl(value: string): string | null {
  if (!value) return null
  const v = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(v)
    if (!url.hostname.includes('.'))
      return 'URL 형식이 올바르지 않습니다. (예: https://example.com)'
    return null
  } catch {
    return 'URL 형식이 올바르지 않습니다. (예: https://example.com)'
  }
}

export function normalizeUrl(value: string): string {
  if (!value || /^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function validateAmount(value: string): string | null {
  if (!value) return null
  const n = parseFloat(value.replace(/,/g, ''))
  if (isNaN(n)) return '올바른 숫자를 입력해주세요.'
  if (n < 0) return '0 이상의 값을 입력해주세요.'
  return null
}

export function validateCount(value: string, min = 1): string | null {
  if (!value) return null
  const n = Number(value)
  if (!Number.isInteger(n) || String(n) !== value.trim()) return '정수를 입력해주세요.'
  if (n < min) return `${min} 이상의 값을 입력해주세요.`
  return null
}

export function validateRatio(value: string): string | null {
  if (!value) return null
  const n = parseFloat(value)
  if (isNaN(n)) return '올바른 숫자를 입력해주세요.'
  if (n < 0 || n > 100) return '0~100 사이의 값을 입력해주세요.'
  return null
}
