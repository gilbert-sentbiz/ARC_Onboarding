'use client'
import { ArrowLeft } from '@phosphor-icons/react'
import { useState } from 'react'
import type { ReactNode } from 'react'

type Props = {
  step: number
  totalSteps: number
  titles: string[]
  onBack: () => void
  onDraftSave?: () => void
  children: ReactNode
}

export default function FormShell({
  step,
  totalSteps,
  titles,
  onBack,
  onDraftSave,
  children,
}: Props) {
  const [saved, setSaved] = useState(false)

  function handleDraftSave() {
    onDraftSave?.()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: 'var(--sb-n50)' }}
    >
      <div className="w-full max-w-[680px] mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] transition-colors"
            style={{ color: 'var(--sb-n500)' }}
          >
            <ArrowLeft size={16} />
            이전
          </button>
          <div className="flex items-center gap-4">
            {onDraftSave && (
              <button
                type="button"
                onClick={handleDraftSave}
                className="text-[13px] font-medium transition-colors"
                style={{ color: 'var(--sb-brand)' }}
              >
                {saved ? '저장됨 ✓' : '임시저장'}
              </button>
            )}
            <span className="text-[13px] font-medium" style={{ color: 'var(--sb-n500)' }}>
              {step + 1} / {totalSteps}
            </span>
          </div>
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--sb-n200)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%`, background: 'var(--sb-brand)' }}
          />
        </div>
      </div>

      <div
        className="w-full max-w-[680px] bg-white rounded-[16px] p-8 flex flex-col gap-7"
        style={{ boxShadow: 'var(--shadow-200)' }}
      >
        <div>
          <p
            className="text-[12px] font-semibold tracking-[1px] uppercase mb-1"
            style={{ color: 'var(--sb-brand)' }}
          >
            2차 정보 입력
          </p>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--sb-n900)' }}>
            {titles[step]}
          </h2>
        </div>
        {children}
      </div>
    </div>
  )
}
