import { useState } from 'react'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import type { QuestionRule } from '../../../types'

interface Props {
  title: string
  questions: QuestionRule[]
  initialData?: Record<string, unknown>
  onComplete: (data: Record<string, unknown>) => void
  onBack: () => void
  onDraftSave?: (data: Record<string, unknown>) => void
}

export default function DynamicQuestionsSection({ title, questions, initialData, onComplete, onBack, onDraftSave }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(questions.map(q => [q.id, (initialData?.[q.id] as string) ?? '']))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(id: string, val: string) {
    const next = { ...values, [id]: val }
    setValues(next)
    if (errors[id]) setErrors(e => { const c = { ...e }; delete c[id]; return c })
    onDraftSave?.(next)
  }

  function validate() {
    const errs: Record<string, string> = {}
    for (const q of questions) {
      if (q.isRequired && !values[q.id]) errs[q.id] = '필수 항목입니다'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onComplete(values)
  }

  return (
    <div className="min-h-screen bg-sb-n50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[560px] bg-white rounded-[16px] border border-sb-n100 shadow-sm p-8">
        <h2 className="text-[20px] font-semibold text-sb-n900 mb-6">{title}</h2>
      <div className="flex flex-col gap-6">
        {questions.map(q => (
          <div key={q.id}>
            <label className="block text-[13px] font-medium text-sb-n700 mb-1.5">
              {q.label}
              {q.isRequired && <span className="text-sb-negative ml-0.5">*</span>}
            </label>

            {(q.inputType === 'text' || q.inputType === 'number') && (
              <input
                type={q.inputType}
                value={values[q.id]}
                onChange={(e) => set(q.id, e.target.value)}
                className={`w-full border rounded-[8px] px-3 py-2.5 text-[14px] text-sb-n800 focus:outline-none focus:border-sb-brand ${errors[q.id] ? 'border-sb-negative' : 'border-sb-n200'}`}
              />
            )}

            {q.inputType === 'textarea' && (
              <textarea
                value={values[q.id]}
                onChange={(e) => set(q.id, e.target.value)}
                rows={3}
                className={`w-full border rounded-[8px] px-3 py-2.5 text-[14px] text-sb-n800 resize-none focus:outline-none focus:border-sb-brand ${errors[q.id] ? 'border-sb-negative' : 'border-sb-n200'}`}
              />
            )}

            {q.inputType === 'select' && (
              <select
                value={values[q.id]}
                onChange={(e) => set(q.id, e.target.value)}
                className={`w-full border rounded-[8px] px-3 py-2.5 text-[14px] text-sb-n800 focus:outline-none focus:border-sb-brand bg-white ${errors[q.id] ? 'border-sb-negative' : 'border-sb-n200'}`}
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
                      checked={values[q.id] === opt.value}
                      onChange={() => set(q.id, opt.value)}
                      className="text-sb-brand accent-sb-brand"
                    />
                    <span className="text-[14px] text-sb-n700">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {errors[q.id] && <p className="text-[12px] text-sb-negative mt-1">{errors[q.id]}</p>}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] text-[14px] font-medium text-sb-n600 border border-sb-n200 hover:bg-sb-n50"
        >
          <ArrowLeft size={15} />
          이전
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-[8px] text-[14px] font-medium bg-sb-brand text-white"
        >
          다음
          <ArrowRight size={15} />
        </button>
      </div>
      </div>
    </div>
  )
}
