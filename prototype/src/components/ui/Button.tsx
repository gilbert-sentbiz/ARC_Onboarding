import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-[120ms] cursor-pointer select-none whitespace-nowrap rounded-[6px] disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-sb-brand text-white hover:bg-sb-brand-hover active:bg-sb-brand-heavy disabled:bg-sb-n150 disabled:text-sb-n300',
  secondary:
    'bg-sb-n150 text-sb-brand hover:bg-sb-n200 active:bg-sb-n300 disabled:bg-sb-n150 disabled:text-sb-n300',
  outline:
    'bg-white border border-sb-n200 text-sb-n700 hover:bg-sb-n50 hover:border-sb-n300 active:bg-sb-n100 disabled:bg-sb-n150 disabled:border-sb-n200 disabled:text-sb-n300',
  ghost:
    'bg-transparent text-sb-n500 hover:bg-sb-n100 active:bg-sb-n150 disabled:text-sb-n300',
}

const sizes: Record<Size, string> = {
  lg: 'h-12 px-5 text-[14px] leading-[16px] tracking-[0.175px]',
  md: 'h-10 px-4 text-[14px] leading-[16px] tracking-[0.175px]',
  sm: 'h-9 px-3.5 text-[12px] leading-[14px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
