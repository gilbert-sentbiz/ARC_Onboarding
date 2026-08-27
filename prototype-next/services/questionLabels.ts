import { getRuleSet } from '@/store/ruleStore'
import type { QuestionRule } from '@/types'

// PI-250: 질문 라벨/옵션 라벨 치환 유틸 — 고객 리뷰(review/second)와 내부 케이스 상세에서 공유.

// 질문 id → q.label (항목명 치환용)
export function buildLabelMap(): Record<string, string> {
  const rs = getRuleSet()
  const map: Record<string, string> = {}
  function walk(qs: QuestionRule[]) {
    for (const q of qs) {
      map[q.id] = q.label
      if (q.children?.length) walk(q.children)
    }
  }
  walk(rs.questionPool)
  for (const config of rs.segmentQuestionConfigs) {
    walk(config.ownQuestions)
  }
  return map
}

// 질문 id → { 옵션 value → 옵션 label } (라디오/셀렉트/multi 값 치환용)
export function buildOptionMap(): Record<string, Record<string, string>> {
  const rs = getRuleSet()
  const map: Record<string, Record<string, string>> = {}
  function walk(qs: QuestionRule[]) {
    for (const q of qs) {
      if (q.options?.length) {
        map[q.id] = Object.fromEntries(q.options.map((o) => [o.value, o.label]))
      }
      if (q.children?.length) walk(q.children)
    }
  }
  walk(rs.questionPool)
  for (const config of rs.segmentQuestionConfigs) {
    walk(config.ownQuestions)
  }
  return map
}

// 질문 id → 한글 라벨 (반복 접미사 _N 제거 fallback)
export function getLabel(key: string, labelMap: Record<string, string>): string {
  if (labelMap[key]) return labelMap[key]
  const base = key.replace(/_\d+$/, '')
  if (base !== key && labelMap[base]) return labelMap[base]
  return key
}

// 옵션 value → 라벨 (배열/콤마문자열/단일 모두 처리, opts 없으면 원본)
export function renderOptionValue(val: unknown, opts?: Record<string, string>): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? '예' : '아니오'
  if (Array.isArray(val)) {
    if (!val.length) return '—'
    return val.map((v) => opts?.[String(v)] ?? String(v)).join(', ')
  }
  const s = String(val)
  if (opts && s.includes(',')) {
    return s.split(',').filter(Boolean).map((v) => opts[v] ?? v).join(', ')
  }
  return opts?.[s] ?? s
}
