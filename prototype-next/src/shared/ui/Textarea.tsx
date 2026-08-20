'use client'

import { type TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helper?: string
}

export default function Textarea({ label, error, helper, className = '', ...rest }: Props) {
  const borderStyle: React.CSSProperties = error
    ? { borderColor: 'var(--sb-negative)' }
    : { borderColor: 'var(--sb-n200)' }

  const disabledStyle: React.CSSProperties = rest.disabled
    ? { background: 'var(--sb-n150)', borderColor: 'var(--sb-n300)', color: 'var(--sb-n300)' }
    : { color: 'var(--sb-n900)' }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          className="text-[14px] leading-[20px] font-normal"
          style={{ color: 'var(--sb-n500)' }}
        >
          {label}
        </label>
      )}
      <textarea
        className="px-4 py-3 rounded-[6px] border bg-white resize-none outline-none transition-colors duration-[120ms] text-[14px] leading-[20px]"
        style={{ ...borderStyle, ...disabledStyle }}
        rows={3}
        {...rest}
      />
      {error && (
        <p className="text-[11px] leading-[16px]" style={{ color: 'var(--sb-negative)' }}>
          {error}
        </p>
      )}
      {!error && helper && (
        <p className="text-[11px] leading-[16px]" style={{ color: 'var(--sb-n500)' }}>
          {helper}
        </p>
      )}
    </div>
  )
}
