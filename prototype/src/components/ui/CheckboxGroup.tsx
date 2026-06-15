import { Check } from '@phosphor-icons/react'

interface Option { value: string; label: string }

interface Props {
  label?: string
  required?: boolean
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  error?: string
  layout?: 'row' | 'col'
  otherKey?: string
  otherValue?: string
  onOtherChange?: (v: string) => void
  otherPlaceholder?: string
}

export default function CheckboxGroup({
  label, required, options, values, onChange, error,
  layout = 'col', otherKey, otherValue, onOtherChange, otherPlaceholder,
}: Props) {
  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="text-[14px] leading-[20px] text-sb-n500">
          {label}{required && <span className="text-sb-negative ml-0.5">*</span>}
        </p>
      )}
      <div className={`flex ${layout === 'col' ? 'flex-col gap-2' : 'flex-wrap gap-3'}`}>
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer" onClick={() => toggle(o.value)}>
            <div className={`flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors duration-[120ms] ${
              values.includes(o.value) ? 'bg-sb-brand border-sb-brand' : 'border-sb-n300'
            }`}>
              {values.includes(o.value) && <Check size={12} weight="bold" className="text-white" />}
            </div>
            <span className="text-[14px] text-sb-n800">{o.label}</span>
          </label>
        ))}
        {otherKey && (
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => toggle(otherKey)}>
            <div className={`flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors duration-[120ms] ${
              values.includes(otherKey) ? 'bg-sb-brand border-sb-brand' : 'border-sb-n300'
            }`}>
              {values.includes(otherKey) && <Check size={12} weight="bold" className="text-white" />}
            </div>
            <span className="text-[14px] text-sb-n800">기타</span>
          </label>
        )}
      </div>
      {otherKey && values.includes(otherKey) && onOtherChange && (
        <input
          className="mt-1 h-10 px-4 rounded-[6px] border border-sb-n200 focus:border-sb-brand outline-none text-[14px] text-sb-n900"
          placeholder={otherPlaceholder ?? '직접 입력'}
          value={otherValue ?? ''}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      )}
      {error && <p className="text-[11px] text-sb-negative">{error}</p>}
    </div>
  )
}
