import { type SelectHTMLAttributes } from 'react'
import { CaretDown } from '@phosphor-icons/react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export default function Select({ label, error, options, placeholder, className = '', ...rest }: Props) {
  const borderColor = error ? 'border-sb-negative' : 'border-sb-n200 focus-within:border-sb-brand'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[14px] leading-[20px] text-sb-n500 font-normal">{label}</label>
      )}
      <div className={`relative flex items-center h-10 rounded-[6px] border bg-white transition-colors duration-[120ms] ${borderColor}`}>
        <select
          className="w-full h-full px-4 pr-10 appearance-none bg-transparent outline-none text-[14px] leading-[20px] text-sb-n900 cursor-pointer"
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <CaretDown size={16} className="absolute right-3 pointer-events-none text-sb-n400" />
      </div>
      {error && <p className="text-[11px] leading-[16px] text-sb-negative">{error}</p>}
    </div>
  )
}
