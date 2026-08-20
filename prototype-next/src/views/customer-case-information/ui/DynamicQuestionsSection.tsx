'use client'

import styled from '@emotion/styled'
import { ArrowLeft, ArrowRight, Plus, Trash } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

import { createSecondIntakeSchema } from '@/src/features/case-validation/model/schemas'
import { normalizeUrl } from '@/src/features/case-validation/model/validators'
import { colors } from '@/src/shared/const/tokens'
import type { QuestionRule } from '@/src/shared/type'
import DateInput from '@/src/shared/ui/DateInput'

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

const URL_IDS = new Set(['qe_fi_website', 'qs_vnd_website'])

function baseId(id: string): string {
  return id.replace(/_\d+$/, '')
}

function isDateField(id: string): boolean {
  return DATE_QUESTION_IDS.has(baseId(id))
}

// ── Styled components ──────────────────────────────────────────────────────

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  background: ${colors.n50};
`

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  background: ${colors.white};
  border-radius: 16px;
  border: 1px solid ${colors.n100};
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 32px;
`

const ProgressWrap = styled.div`
  margin-bottom: 20px;
`

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  overflow: hidden;
  background: ${colors.n100};
`

const ProgressFill = styled.div<{ pct: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: width 300ms;
  background: ${colors.brand};
  width: ${({ pct }) => pct}%;
`

const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
  color: ${colors.n900};
`

const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const QuestionWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FieldLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: ${colors.n700};
`

const Required = styled.span`
  margin-left: 2px;
  color: ${colors.negative};
`

const StyledInput = styled.input<{ hasError: boolean }>`
  width: 100%;
  border: 1px solid ${({ hasError }) => (hasError ? colors.negative : colors.n200)};
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: ${colors.n800};
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ hasError }) => (hasError ? colors.negative : colors.brand)};
  }
`

const StyledTextarea = styled.textarea<{ hasError: boolean }>`
  width: 100%;
  border: 1px solid ${({ hasError }) => (hasError ? colors.negative : colors.n200)};
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: ${colors.n800};
  outline: none;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ hasError }) => (hasError ? colors.negative : colors.brand)};
  }
`

const StyledSelect = styled.select<{ hasError: boolean }>`
  width: 100%;
  border: 1px solid ${({ hasError }) => (hasError ? colors.negative : colors.n200)};
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: ${colors.n800};
  outline: none;
  background: ${colors.white};
  font-family: inherit;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ hasError }) => (hasError ? colors.negative : colors.brand)};
  }
`

const RadioRow = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`

const FieldError = styled.p`
  font-size: 12px;
  margin: 4px 0 0;
  color: ${colors.negative};
`

const RepeatLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.n700};
`

const RepeatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const RepeatItem = styled.div`
  border: 1px solid ${colors.n100};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${colors.n50};
`

const RepeatItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const RepeatIndex = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.n400};
`

const DeleteBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${colors.negative};
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${colors.brand};
  color: ${colors.brand};
  background: none;
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: ${colors.blue50};
  }
`

const ChildIndent = styled.div`
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid ${colors.n100};
`

const NavRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
`

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid ${colors.n200};
  color: ${colors.n600};
  background: none;
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: ${colors.n50};
  }
`

const NextBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  color: ${colors.white};
  background: ${colors.brand};
  cursor: pointer;
  transition: background 120ms;
  &:hover {
    background: ${colors.brandHover};
  }
`

// ── Types ──────────────────────────────────────────────────────────────────

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
      <FieldLabel>
        {q.label}
        {q.isRequired && <Required>*</Required>}
      </FieldLabel>

      {(q.inputType === 'text' || q.inputType === 'number') && isDateField(q.id) && (
        <DateInput value={value} onChange={onChange} error={!!error} />
      )}

      {(q.inputType === 'text' || q.inputType === 'number') && !isDateField(q.id) && (
        <StyledInput
          type={q.inputType}
          value={value}
          hasError={!!error}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (URL_IDS.has(baseId(q.id)) && value) onChange(normalizeUrl(value))
          }}
        />
      )}

      {q.inputType === 'textarea' && (
        <StyledTextarea
          value={value}
          hasError={!!error}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      )}

      {q.inputType === 'select' && (
        <StyledSelect value={value} hasError={!!error} onChange={(e) => onChange(e.target.value)}>
          <option value="">선택하세요</option>
          {q.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </StyledSelect>
      )}

      {q.inputType === 'radio' && (
        <RadioRow>
          {q.options?.map((opt) => (
            <RadioLabel key={opt.value}>
              <input
                type="radio"
                name={q.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                style={{ accentColor: colors.brand }}
              />
              <span style={{ fontSize: 14, color: colors.n700 }}>{opt.label}</span>
            </RadioLabel>
          ))}
        </RadioRow>
      )}

      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

export default function DynamicQuestionsSection({
  title,
  questions,
  initialData,
  isKR,
  screenInfo,
  onComplete,
  onBack,
  onDraftSave,
}: Props) {
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
    if (Object.keys(missing).length > 0) setValues((v) => ({ ...missing, ...v }))
  }, [repeatCounts])

  function set(id: string, val: string) {
    const next = { ...values, [id]: val }
    setValues(next)
    if (errors[id])
      setErrors((e) => {
        const c = { ...e }
        delete c[id]
        return c
      })
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

  function validate(): boolean {
    const schema = createSecondIntakeSchema(questions, isKR ?? false, repeatCounts)
    const result = schema.safeParse(values)
    if (result.success) {
      setErrors({})
      return true
    }
    const errs: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string | undefined
      if (key && !errs[key]) errs[key] = issue.message
    }
    setErrors(errs)
    return false
  }

  function handleSubmit() {
    if (!validate()) return
    onComplete(values)
  }

  function renderQuestion(q: QuestionRule) {
    if (!isVisible(q)) return null
    return (
      <QuestionWrap key={q.id}>
        {q.repeat ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <RepeatLabel>{q.label}</RepeatLabel>
            <RepeatList>
              {Array.from({ length: 1 + (repeatCounts[q.id] ?? 0) }, (_, i) => (
                <RepeatItem key={i}>
                  <RepeatItemHeader>
                    <RepeatIndex>#{i + 1}</RepeatIndex>
                    {i > 0 && (
                      <DeleteBtn
                        type="button"
                        onClick={() =>
                          setRepeatCounts((c) => ({ ...c, [q.id]: (c[q.id] ?? 0) - 1 }))
                        }
                      >
                        <Trash size={12} />
                        삭제
                      </DeleteBtn>
                    )}
                  </RepeatItemHeader>
                  {q.children?.map((child) => {
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
                </RepeatItem>
              ))}
            </RepeatList>
            <AddBtn
              type="button"
              onClick={() => setRepeatCounts((c) => ({ ...c, [q.id]: (c[q.id] ?? 0) + 1 }))}
            >
              <Plus size={13} />
              {q.addButtonLabel ?? `${q.label} 추가`}
            </AddBtn>
          </div>
        ) : (
          <QuestionField
            q={q}
            value={values[q.id] ?? ''}
            error={errors[q.id]}
            onChange={(val) => set(q.id, val)}
          />
        )}

        {!q.repeat &&
          q.children
            ?.filter((c) => isChildVisible(c))
            .map((child) => (
              <ChildIndent key={child.id}>
                <QuestionField
                  q={child}
                  value={values[child.id] ?? ''}
                  error={errors[child.id]}
                  onChange={(val) => set(child.id, val)}
                />
              </ChildIndent>
            ))}
      </QuestionWrap>
    )
  }

  return (
    <Container>
      <Card>
        {screenInfo && (
          <ProgressWrap>
            <ProgressHeader>
              <span style={{ fontSize: 12, color: colors.n500 }}>{screenInfo.label}</span>
              <span style={{ fontSize: 12, color: colors.n500 }}>
                {screenInfo.current} / {screenInfo.total}
              </span>
            </ProgressHeader>
            <ProgressTrack>
              <ProgressFill pct={Math.round((screenInfo.current / screenInfo.total) * 100)} />
            </ProgressTrack>
          </ProgressWrap>
        )}

        <CardTitle>{title}</CardTitle>
        <QuestionList>{questions.map((q) => renderQuestion(q))}</QuestionList>

        <NavRow>
          <BackBtn onClick={onBack}>
            <ArrowLeft size={15} />
            이전
          </BackBtn>
          <NextBtn onClick={handleSubmit}>
            다음
            <ArrowRight size={15} />
          </NextBtn>
        </NavRow>
      </Card>
    </Container>
  )
}
