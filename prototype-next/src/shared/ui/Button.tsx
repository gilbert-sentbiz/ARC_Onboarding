'use client'

import styled from '@emotion/styled'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

import { colors, duration, radius } from '@/src/shared/const/tokens'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const sizeStyles: Record<Size, string> = {
  lg: `height: 48px; padding: 0 20px; font-size: 14px; line-height: 16px; letter-spacing: 0.175px;`,
  md: `height: 40px; padding: 0 16px; font-size: 14px; line-height: 16px; letter-spacing: 0.175px;`,
  sm: `height: 36px; padding: 0 14px; font-size: 12px; line-height: 14px;`,
}

const variantStyles: Record<Variant, string> = {
  primary: `
    background: ${colors.brand};
    color: ${colors.white};
    &:hover:not(:disabled) { background: ${colors.brandHover}; }
    &:active:not(:disabled) { background: ${colors.brandHeavy}; }
    &:disabled { background: ${colors.n150}; color: ${colors.n300}; }
  `,
  secondary: `
    background: ${colors.n150};
    color: ${colors.brand};
    &:hover:not(:disabled) { background: ${colors.n200}; }
    &:disabled { background: ${colors.n150}; color: ${colors.n300}; }
  `,
  outline: `
    background: ${colors.white};
    color: ${colors.n700};
    border: 1px solid ${colors.n200};
    &:hover:not(:disabled) { background: ${colors.n50}; }
    &:disabled { background: ${colors.n150}; border-color: ${colors.n200}; color: ${colors.n300}; }
  `,
  ghost: `
    background: transparent;
    color: ${colors.n500};
    &:hover:not(:disabled) { background: ${colors.n100}; }
    &:disabled { color: ${colors.n300}; }
  `,
}

const StyledButton = styled.button<{ variant: Variant; size: Size; fullWidth: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  font-family: inherit;
  transition: all ${duration.fast};
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border-radius: ${radius[6]};
  border: none;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  &:disabled {
    cursor: not-allowed;
  }
  ${({ size }) => sizeStyles[size]}
  ${({ variant }) => variantStyles[variant]}
`

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...rest
}: Props) {
  return (
    <StyledButton variant={variant} size={size} fullWidth={fullWidth} {...rest}>
      {children}
    </StyledButton>
  )
}
