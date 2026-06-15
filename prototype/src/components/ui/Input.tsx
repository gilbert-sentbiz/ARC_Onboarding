import { type InputHTMLAttributes, type ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export default function Input({ label, error, helper, iconLeft, iconRight, className = '', ...rest }: Props) {
  const borderColor = error
    ? 'border-sb-negative focus-within:border-sb-negative'
    : 'border-sb-n200 focus-within:border-sb-brand'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[14px] leading-[20px] text-sb-n500 font-normal tracking-[0.07px]">
          {label}
        </label>
      )}
      <div
        className={`flex items-center h-10 px-4 gap-2 rounded-[6px] border bg-white transition-colors duration-[120ms] ${borderColor} ${rest.disabled ? 'bg-sb-n150 border-sb-n300 cursor-not-allowed' : ''}`}
      >
        {iconLeft && <span className="flex-shrink-0 text-sb-n400">{iconLeft}</span>}
        <input
          className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[14px] leading-[20px] text-sb-n900 placeholder:text-sb-n400 disabled:text-sb-n300 disabled:cursor-not-allowed font-normal tracking-[0.07px]"
          {...rest}
        />
        {iconRight && <span className="flex-shrink-0 text-sb-n400">{iconRight}</span>}
      </div>
      {error && (
        <p className="text-[11px] leading-[16px] text-sb-negative tracking-[0.055px]">{error}</p>
      )}
      {!error && helper && (
        <p className="text-[11px] leading-[16px] text-sb-n500 tracking-[0.055px]">{helper}</p>
      )}
    </div>
  )
}
