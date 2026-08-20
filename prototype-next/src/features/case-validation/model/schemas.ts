import { z } from 'zod'

import type { QuestionRule } from '@/src/shared/type'

import {
  validateKrBizRegNo,
  validateKrCorpRegNo,
  validateDate,
  validatePhone,
  validateEmail,
  validateUrl,
  validateRatio,
  validateCount,
  validateAmount,
} from './validators'

// ── Constants used in 2nd intake field-level validation ────────────────────

const DATE_QUESTION_IDS = new Set([
  'qe_corp_founded_date',
  'qe_corp_rep_dob',
  'qe_corp_bo_dob',
  'qe_indiv_rep_dob',
  'qe_indiv_bo_dob',
  'qe_fi_founded_date',
  'qe_fi_rep_dob',
  'qe_fi_ubo_dob',
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

function getFieldFormatError(id: string, val: string, isKR: boolean): string | null {
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

// ── 1차 Intake Schema ──────────────────────────────────────────────────────

export function createFirstIntakeSchema() {
  return z
    .object({
      companyName: z.string().min(1, '필수 항목입니다.'),
      contactName: z.string().min(1, '필수 항목입니다.'),
      contactTitle: z.string().min(1, '필수 항목입니다.'),
      phone: z
        .string()
        .min(1, '필수 항목입니다.')
        .superRefine((val, ctx) => {
          const err = validatePhone(val)
          if (err) ctx.addIssue({ code: 'custom', message: err })
        }),
      email: z
        .string()
        .min(1, '필수 항목입니다.')
        .superRefine((val, ctx) => {
          const err = validateEmail(val)
          if (err) ctx.addIssue({ code: 'custom', message: err })
        }),
      services: z.array(z.string()).min(1, '서비스를 하나 이상 선택해주세요.'),
      collectionCountries: z.array(z.string()),
      collectionOtherCountry: z.string(),
      remittanceFrom: z.string(),
      remittanceFromOther: z.string(),
      remittanceTo: z.array(z.string()),
      remittanceToOther: z.string(),
      businessType: z.string().min(1, '사업자 유형을 선택해주세요.'),
      foundingCountry: z.string().min(1, '설립 국가를 선택해주세요.'),
      monthlyVolume: z
        .string()
        .min(1, '필수 항목입니다.')
        .superRefine((val, ctx) => {
          const err = validateAmount(val)
          if (err) ctx.addIssue({ code: 'custom', message: err })
        }),
      monthlyVolumeCurrency: z.string(),
      monthlyVolumeCurrencyOther: z.string(),
      referralSource: z.string().min(1, '선택해주세요.'),
      additionalNote: z.string(),
      agreed: z.boolean().refine((v) => v, { message: '동의가 필요합니다.' }),
    })
    .superRefine((data, ctx) => {
      if (data.services.includes('collection')) {
        if (data.collectionCountries.length === 0)
          ctx.addIssue({
            code: 'custom',
            message: '수금 국가를 하나 이상 선택해주세요.',
            path: ['collectionCountries'],
          })
        if (data.collectionCountries.includes('OTHER') && !data.collectionOtherCountry.trim())
          ctx.addIssue({
            code: 'custom',
            message: '수금 국가를 직접 입력해주세요.',
            path: ['collectionOtherCountry'],
          })
      }
      if (data.services.includes('remittance')) {
        const fromVal =
          data.remittanceFrom === '__OTHER__' ? data.remittanceFromOther : data.remittanceFrom
        if (!fromVal.trim())
          ctx.addIssue({ code: 'custom', message: '필수 항목입니다.', path: ['remittanceFrom'] })
        if (data.remittanceTo.length === 0)
          ctx.addIssue({
            code: 'custom',
            message: '도착 국가를 하나 이상 선택해주세요.',
            path: ['remittanceTo'],
          })
        if (data.remittanceTo.includes('__OTHER__') && !data.remittanceToOther.trim())
          ctx.addIssue({
            code: 'custom',
            message: '도착 국가를 직접 입력해주세요.',
            path: ['remittanceToOther'],
          })
      }
      if (data.monthlyVolumeCurrency === 'OTHER' && !data.monthlyVolumeCurrencyOther.trim())
        ctx.addIssue({
          code: 'custom',
          message: '통화를 직접 입력해주세요.',
          path: ['monthlyVolumeCurrencyOther'],
        })
    })
}

export type FirstIntakeData = z.infer<ReturnType<typeof createFirstIntakeSchema>>

// ── 2차 Intake Schema (dynamic, built from rule set questions) ─────────────

export function createSecondIntakeSchema(
  questions: QuestionRule[],
  isKR: boolean,
  repeatCounts: Record<string, number>
) {
  return z.record(z.string(), z.string()).superRefine((data, ctx) => {
    function isChildVisible(child: QuestionRule): boolean {
      if (!child.showWhen) return true
      return data[child.showWhen.parentId] === child.showWhen.value
    }

    function isVisible(q: QuestionRule): boolean {
      if (!q.showWhen) return true
      return data[q.showWhen.parentId] === q.showWhen.value
    }

    function check(qs: QuestionRule[]) {
      for (const q of qs) {
        if (!isVisible(q)) continue
        if (q.repeat) {
          const instanceCount = 1 + (repeatCounts[q.id] ?? 0)
          for (let i = 0; i < instanceCount; i++) {
            for (const child of q.children ?? []) {
              const repeatId = i === 0 ? child.id : `${child.id}_${i}`
              const val = data[repeatId] ?? ''
              if (child.isRequired && !val) {
                ctx.addIssue({ code: 'custom', message: '필수 항목입니다', path: [repeatId] })
              } else {
                const fmt = getFieldFormatError(repeatId, val, isKR)
                if (fmt) ctx.addIssue({ code: 'custom', message: fmt, path: [repeatId] })
              }
            }
          }
        } else {
          const val = data[q.id] ?? ''
          if (q.isRequired && !val) {
            ctx.addIssue({ code: 'custom', message: '필수 항목입니다', path: [q.id] })
          } else {
            const fmt = getFieldFormatError(q.id, val, isKR)
            if (fmt) ctx.addIssue({ code: 'custom', message: fmt, path: [q.id] })
          }
          if (q.children?.length) {
            check(q.children.filter((c) => isChildVisible(c)))
          }
        }
      }
    }

    check(questions)
  })
}
