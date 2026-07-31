'use client'

import { type SelectHTMLAttributes } from 'react'
import { CaretDown } from '@phosphor-icons/react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  required?: boolean
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export default function Select({ label, required, error, options, placeholder, className = '', ...rest }: Props) {
  const wrapperBorderStyle: React.CSSProperties = error
    ? { borderColor: 'var(--sb-negative)' }
    : { borderColor: 'var(--sb-n200)' }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          className="text-[14px] leading-[20px] font-normal"
          style={{ color: 'var(--sb-n500)' }}
        >
          {label}
          {required && <span className="ml-0.5" style={{ color: 'var(--sb-negative)' }}>*</span>}
        </label>
      )}
      <div
        className="relative flex items-center h-10 rounded-[6px] border bg-white transition-colors duration-[120ms]"
        style={wrapperBorderStyle}
      >
        <select
          className="w-full h-full px-4 pr-10 appearance-none bg-transparent outline-none text-[14px] leading-[20px] cursor-pointer"
          style={{ color: 'var(--sb-n900)' }}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <CaretDown size={16} className="absolute right-3 pointer-events-none" style={{ color: 'var(--sb-n400)' }} />
      </div>
      {error && (
        <p className="text-[11px] leading-[16px]" style={{ color: 'var(--sb-negative)' }}>{error}</p>
      )}
    </div>
  )
}
