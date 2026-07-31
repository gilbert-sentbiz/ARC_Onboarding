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
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
