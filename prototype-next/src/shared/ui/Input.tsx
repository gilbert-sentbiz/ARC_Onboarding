'use client'

import { type InputHTMLAttributes, type ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  required?: boolean
  error?: string
  helper?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export default function Input({
  label,
  required,
  error,
  helper,
  iconLeft,
  iconRight,
  className = '',
  ...rest
}: Props) {
  const wrapperBorderStyle: React.CSSProperties = error
    ? { borderColor: 'var(--sb-negative)' }
    : { borderColor: 'var(--sb-n200)' }

  const disabledWrapperStyle: React.CSSProperties = rest.disabled
    ? { background: 'var(--sb-n150)', borderColor: 'var(--sb-n300)' }
    : {}

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          className="text-[14px] leading-[20px] font-normal tracking-[0.07px]"
          style={{ color: 'var(--sb-n500)' }}
        >
          {label}
          {required && (
            <span className="ml-0.5" style={{ color: 'var(--sb-negative)' }}>
              *
            </span>
          )}
        </label>
      )}
      <div
        className={`flex items-center h-10 px-4 gap-2 rounded-[6px] border bg-white transition-colors duration-[120ms] ${rest.disabled ? 'cursor-not-allowed' : ''}`}
        style={{ ...wrapperBorderStyle, ...disabledWrapperStyle }}
      >
        {iconLeft && (
          <span className="flex-shrink-0" style={{ color: 'var(--sb-n400)' }}>
            {iconLeft}
          </span>
        )}
        <input
          className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[14px] leading-[20px] font-normal tracking-[0.07px] disabled:cursor-not-allowed"
          style={{ color: 'var(--sb-n900)' } as React.CSSProperties}
          {...rest}
        />
        {iconRight && (
          <span className="flex-shrink-0" style={{ color: 'var(--sb-n400)' }}>
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <p
          className="text-[11px] leading-[16px] tracking-[0.055px]"
          style={{ color: 'var(--sb-negative)' }}
        >
          {error}
        </p>
      )}
      {!error && helper && (
        <p
          className="text-[11px] leading-[16px] tracking-[0.055px]"
          style={{ color: 'var(--sb-n500)' }}
        >
          {helper}
        </p>
      )}
    </div>
  )
}
