'use client'

import { useState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'

type Props = {
  value: string
  onChange: (val: string) => void
  error?: boolean
}

export default function DateInput({ value, onChange, error }: Props) {
  const [focused, setFocused] = useState(false)

  const borderStyle: React.CSSProperties = error
    ? { borderColor: 'var(--sb-negative)' }
    : focused
      ? { borderColor: 'var(--sb-brand)' }
      : { borderColor: 'var(--sb-n200)' }

  return (
    <div className="relative">
      <div
        className="w-full border rounded-[8px] px-3 py-2.5 text-[14px] flex items-center justify-between pointer-events-none"
        style={borderStyle}
      >
        <span style={{ color: value ? 'var(--sb-n800)' : 'var(--sb-n400)' }}>
          {value || 'YYYY-MM-DD'}
        </span>
        <CalendarBlank size={16} className="flex-shrink-0" style={{ color: 'var(--sb-n400)' }} />
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // PI-234: opacity-0 date input은 본문 클릭으로 달력이 안 열림(캘린더 인디케이터도 투명).
        // 클릭 시 showPicker()로 달력 강제 오픈. 미지원 브라우저는 옵셔널 체이닝으로 무해.
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.()
          } catch {
            /* showPicker 미지원/보안 제약 시 무시 — 키보드 입력은 그대로 동작 */
          }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
