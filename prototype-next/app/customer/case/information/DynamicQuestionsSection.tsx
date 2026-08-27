'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Plus, Trash } from '@phosphor-icons/react'
import type { QuestionRule } from '@/types'
import {
  validateKrBizRegNo, validateKrCorpRegNo, validateDate,
  validatePhone, validateEmail, validateUrl, normalizeUrl,
  validateRatio, validateCount,
} from '@/services/validators'
import DateInput from '@/components/ui/DateInput'

const DATE_QUESTION_IDS = new Set([
  'qe_corp_founded_date', 'qe_corp_rep_dob', 'qe_corp_bo_dob',
  'qe_indiv_rep_dob', 'qe_indiv_bo_dob',
  'qe_fi_founded_date', 'qe_fi_rep_dob', 'qe_fi_ubo_dob',
])

const PHONE_IDS = new Set(['qe_corp_phone', 'qe_indiv_phone', 'qs_vnd_contact_phone'])
const EMAIL_IDS = new Set(['qs_vnd_contact_email'])
const URL_IDS = new Set(['qe_fi_website', 'qs_vnd_website'])
const RATIO_IDS = new Set(['qe_fi_ubo_share'])
const COUNT_IDS = new Set(['qe_corp_rep_count', 'qe_corp_bo_count'])

function baseId(id: string): string {
  return id.replace(/_\d+$/, '')
}

function isDateField(id: string): boolean {
  return DATE_QUESTION_IDS.has(baseId(id))
}

type Props = {
  title: string
  questions: QuestionRule[]
  initialData?: Record<string, unknown>
  isKR?: boolean
  screenInfo?: { current: number; total: number; label: string }
  onComplete: (data: Record<string, unknown>) => void
  onBack: () => void
  onDraftSave?: (data: Record<string, unknown>) => void
}

type QuestionFieldProps = {
  q: QuestionRule
  value: string
  error?: string
  onChange: (val: string) => void
}

function QuestionField({ q, value, error, onChange }: QuestionFieldProps) {
  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--sb-n700)' }}>
        {q.label}
        {q.isRequired && <span className="ml-0.5" style={{ color: 'var(--sb-negative)' }}>*</span>}
      </label>

      {(q.inputType === 'text' || q.inputType === 'number') && isDateField(q.id) && (
        <DateInput value={value} onChange={onChange} error={!!error} />
      )}

      {(q.inputType === 'text' || q.inputType === 'number') && !isDateField(q.id) && (
        <input
          type={q.inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { if (URL_IDS.has(baseId(q.id)) && value) onChange(normalizeUrl(value)) }}
          className={`w-full border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none`}
          style={error
            ? { color: 'var(--sb-n800)', borderColor: 'var(--sb-negative)' }
            : { color: 'var(--sb-n800)', borderColor: 'var(--sb-n200)' }}
        />
      )}

      {q.inputType === 'textarea' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border rounded-[8px] px-3 py-2.5 text-[14px] resize-none focus:outline-none"
          style={error
            ? { color: 'var(--sb-n800)', borderColor: 'var(--sb-negative)' }
            : { color: 'var(--sb-n800)', borderColor: 'var(--sb-n200)' }}
        />
      )}

      {q.inputType === 'select' && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none bg-white"
          style={error
            ? { color: 'var(--sb-n800)', borderColor: 'var(--sb-negative)' }
            : { color: 'var(--sb-n800)', borderColor: 'var(--sb-n200)' }}
        >
          <option value="">선택하세요</option>
          {q.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {q.inputType === 'radio' && (
        <div className="flex gap-5 flex-wrap">
          {q.options?.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={q.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                style={{ accentColor: 'var(--sb-brand)' }}
              />
              <span className="text-[14px]" style={{ color: 'var(--sb-n700)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* PI-247: 복수 선택 — 체크박스 그룹. 값은 콤마구분 문자열로 저장(옵션 value는 코드라 콤마 없음). */}
      {q.inputType === 'multi' && (() => {
        const selected = value ? value.split(',').filter(Boolean) : []
        const toggle = (v: string) => {
          const next = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]
          onChange(next.join(','))
        }
        return (
          <div className="flex flex-col gap-2">
            {q.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  style={{ accentColor: 'var(--sb-brand)' }}
                />
                <span className="text-[14px]" style={{ color: 'var(--sb-n700)' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        )
      })()}

      {error && <p className="text-[12px] mt-1" style={{ color: 'var(--sb-negative)' }}>{error}</p>}
    </div>
  )
}

export default function DynamicQuestionsSection({ title, questions, initialData, isKR, screenInfo, onComplete, onBack, onDraftSave }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const flat: Record<string, string> = {}
    function collect(qs: QuestionRule[]) {
      for (const q of qs) {
        flat[q.id] = (initialData?.[q.id] as string) ?? ''
        if (q.children?.length) collect(q.children)
      }
    }
    collect(questions)
    return flat
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const missing: Record<string, string> = {}
    for (const q of questions) {
      if (!q.repeat || !q.children) continue
      const count = repeatCounts[q.id] ?? 0
      for (let i = 1; i <= count; i++) {
        const children: QuestionRule[] = q.children
        for (const child of children) {
          const id = `${child.id}_${i}`
          if (!(id in values)) missing[id] = ''
        }
      }
    }
    if (Object.keys(missing).length > 0) setValues(v => ({ ...missing, ...v }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatCounts])

  function set(id: string, val: string) {
    const next = { ...values, [id]: val }
    setValues(next)
    if (errors[id]) setErrors(e => { const c = { ...e }; delete c[id]; return c })
    onDraftSave?.(next)
  }

  function isChildVisible(child: QuestionRule): boolean {
    if (!child.showWhen) return true
    return values[child.showWhen.parentId] === child.showWhen.value
  }

  function isVisible(q: QuestionRule): boolean {
    if (!q.showWhen) return true
    return values[q.showWhen.parentId] === q.showWhen.value
  }

  function getFormatError(id: string, val: string): string | null {
    if (!val) return null
    const b = baseId(id)
    if (isDateField(id)) return validateDate(val)
    if (PHONE_IDS.has(b)) return validatePhone(val)
    if (EMAIL_IDS.has(b)) return validateEmail(val)
    if (URL_IDS.has(b)) return validateUrl(val)
    if (RATIO_IDS.has(b)) return validateRatio(val)
    if (COUNT_IDS.has(b)) return validateCount(val, 1)
    if (isKR) {
      if (b === 'qc_biz_reg_no') return validateKrBizRegNo(val)
      if (b === 'qe_corp_reg_no') return validateKrCorpRegNo(val)
    }
    return null
  }

  function validate() {
    const errs: Record<string, string> = {}
    function check(qs: QuestionRule[]) {
      for (const q of qs) {
        if (!isVisible(q)) continue
        if (q.repeat) {
          const instanceCount = 1 + (repeatCounts[q.id] ?? 0)
          for (let i = 0; i < instanceCount; i++) {
            for (const child of q.children ?? []) {
              const repeatId = i === 0 ? child.id : `${child.id}_${i}`
              if (child.isRequired && !values[repeatId]) {
                errs[repeatId] = '필수 항목입니다'
              } else {
                const fmt = getFormatError(repeatId, values[repeatId] ?? '')
                if (fmt) errs[repeatId] = fmt
              }
            }
          }
        } else {
          if (q.isRequired && !values[q.id]) {
            errs[q.id] = '필수 항목입니다'
          } else {
            const fmt = getFormatError(q.id, values[q.id] ?? '')
            if (fmt) errs[q.id] = fmt
          }
          if (q.children?.length) {
            const visible = q.children.filter(c => isChildVisible(c))
            check(visible)
          }
        }
      }
    }
    check(questions)
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onComplete(values)
  }

  function renderQuestion(q: QuestionRule) {
    if (!isVisible(q)) return null
    return (
      <div key={q.id} className="flex flex-col gap-4">
        {q.repeat ? (
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-medium" style={{ color: 'var(--sb-n700)' }}>{q.label}</span>
            {Array.from({ length: 1 + (repeatCounts[q.id] ?? 0) }, (_, i) => (
              <div key={i} className="border rounded-[8px] p-4 flex flex-col gap-3" style={{ borderColor: 'var(--sb-n100)', background: 'var(--sb-n50)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--sb-n400)' }}>#{i + 1}</span>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setRepeatCounts(c => ({ ...c, [q.id]: (c[q.id] ?? 0) - 1 }))}
                      className="flex items-center gap-1 text-[12px] hover:opacity-80"
                      style={{ color: 'var(--sb-negative)' }}
                    >
                      <Trash size={12} />
                      삭제
                    </button>
                  )}
                </div>
                {q.children?.map(child => {
                  const repeatId = i === 0 ? child.id : `${child.id}_${i}`
                  return (
                    <QuestionField
                      key={repeatId}
                      q={{ ...child, id: repeatId }}
                      value={values[repeatId] ?? ''}
                      error={errors[repeatId]}
                      onChange={(val) => set(repeatId, val)}
                    />
                  )
                })}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRepeatCounts(c => ({ ...c, [q.id]: (c[q.id] ?? 0) + 1 }))}
              className="flex items-center gap-1.5 text-[13px] font-medium self-start px-3 py-1.5 rounded-[6px] border transition-colors"
              style={{ color: 'var(--sb-brand)', borderColor: 'var(--sb-brand)' }}
            >
              <Plus size={13} />
              {q.addButtonLabel ?? `${q.label} 추가`}
            </button>
          </div>
        ) : (
          <QuestionField
            q={q}
            value={values[q.id] ?? ''}
            error={errors[q.id]}
            onChange={(val) => set(q.id, val)}
          />
        )}

        {/* Conditional children */}
        {!q.repeat && q.children?.filter(c => isChildVisible(c)).map(child => (
          <div key={child.id} className="ml-4 pl-4 border-l-2" style={{ borderColor: 'var(--sb-n100)' }}>
            <QuestionField
              q={child}
              value={values[child.id] ?? ''}
              error={errors[child.id]}
              onChange={(val) => set(child.id, val)}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--sb-n50)' }}>
      <div className="w-full max-w-[560px] bg-white rounded-[16px] border shadow-sm p-8" style={{ borderColor: 'var(--sb-n100)' }}>
        {screenInfo && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>{screenInfo.label}</span>
              <span className="text-[12px]" style={{ color: 'var(--sb-n500)' }}>{screenInfo.current} / {screenInfo.total}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sb-n100)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.round((screenInfo.current / screenInfo.total) * 100)}%`, background: 'var(--sb-brand)' }}
              />
            </div>
          </div>
        )}
        <h2 className="text-[20px] font-semibold mb-6" style={{ color: 'var(--sb-n900)' }}>{title}</h2>
        <div className="flex flex-col gap-6">
          {questions.map(q => renderQuestion(q))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] text-[14px] font-medium border"
            style={{ color: 'var(--sb-n600)', borderColor: 'var(--sb-n200)' }}
          >
            <ArrowLeft size={15} />
            이전
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white"
            style={{ background: 'var(--sb-brand)' }}
          >
            다음
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
