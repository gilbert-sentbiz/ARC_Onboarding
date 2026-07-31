'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-[120ms] cursor-pointer select-none whitespace-nowrap rounded-[6px] disabled:cursor-not-allowed'

// sb-* color tokens are moved to inline styles per variant; structure/sizing stays in className
const variantBase: Record<Variant, string> = {
  primary: 'disabled:cursor-not-allowed',
  secondary: 'disabled:cursor-not-allowed',
  outline: 'bg-white border disabled:cursor-not-allowed',
  ghost: 'bg-transparent disabled:cursor-not-allowed',
}

const sizes: Record<Size, string> = {
  lg: 'h-12 px-5 text-[14px] leading-[16px] tracking-[0.175px]',
  md: 'h-10 px-4 text-[14px] leading-[16px] tracking-[0.175px]',
  sm: 'h-9 px-3.5 text-[12px] leading-[14px]',
}

// Inline style maps per variant (applied via style prop; disabled state handled via CSS vars fallback)
function variantStyle(variant: Variant, disabled?: boolean): React.CSSProperties {
  if (disabled) {
    const disabledStyles: Record<Variant, React.CSSProperties> = {
      primary: { background: 'var(--sb-n150)', color: 'var(--sb-n300)' },
      secondary: { background: 'var(--sb-n150)', color: 'var(--sb-n300)' },
      outline: { background: 'var(--sb-n150)', borderColor: 'var(--sb-n200)', color: 'var(--sb-n300)' },
      ghost: { color: 'var(--sb-n300)' },
    }
    return disabledStyles[variant]
  }
  const styles: Record<Variant, React.CSSProperties> = {
    primary: { background: 'var(--sb-brand)', color: '#fff' },
    secondary: { background: 'var(--sb-n150)', color: 'var(--sb-brand)' },
    outline: { borderColor: 'var(--sb-n200)', color: 'var(--sb-n700)' },
    ghost: { color: 'var(--sb-n500)' },
  }
  return styles[variant]
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  style,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled}
      className={`${base} ${variantBase[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...variantStyle(variant, disabled), ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}
