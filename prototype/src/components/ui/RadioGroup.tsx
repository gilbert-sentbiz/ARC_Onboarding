interface Option { value: string; label: string }

interface Props {
  label?: string
  required?: boolean
  options: Option[]
  value: string
  onChange: (value: string) => void
  error?: string
  layout?: 'row' | 'col'
}

export default function RadioGroup({ label, required, options, value, onChange, error, layout = 'row' }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="text-[14px] leading-[20px] text-sb-n500">
          {label}{required && <span className="text-sb-negative ml-0.5">*</span>}
        </p>
      )}
      <div className={`flex ${layout === 'col' ? 'flex-col gap-2' : 'flex-wrap gap-3'}`}>
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onChange(o.value)}
              className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors duration-[120ms] flex-shrink-0 ${
                value === o.value ? 'border-sb-brand' : 'border-sb-n300'
              }`}
            >
              {value === o.value && <div className="w-[8px] h-[8px] rounded-full bg-sb-brand" />}
            </div>
            <span className="text-[14px] text-sb-n800" onClick={() => onChange(o.value)}>{o.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-[11px] text-sb-negative">{error}</p>}
    </div>
  )
}
