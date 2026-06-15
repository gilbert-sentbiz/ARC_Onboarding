import { type TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

export default function Textarea({ label, error, helper, className = '', ...rest }: Props) {
  const borderColor = error
    ? 'border-sb-negative focus:border-sb-negative'
    : 'border-sb-n200 focus:border-sb-brand'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[14px] leading-[20px] text-sb-n500 font-normal">{label}</label>
      )}
      <textarea
        className={`px-4 py-3 rounded-[6px] border bg-white resize-none outline-none transition-colors duration-[120ms] text-[14px] leading-[20px] text-sb-n900 placeholder:text-sb-n400 disabled:bg-sb-n150 disabled:border-sb-n300 disabled:text-sb-n300 ${borderColor}`}
        rows={3}
        {...rest}
      />
      {error && <p className="text-[11px] leading-[16px] text-sb-negative">{error}</p>}
      {!error && helper && <p className="text-[11px] leading-[16px] text-sb-n500">{helper}</p>}
    </div>
  )
}
