'use client'

import styled from '@emotion/styled'
import { Check, Warning, Info, X } from '@phosphor-icons/react'

import { colors } from '@/src/shared/const/tokens'
import { useToastStore } from '@/src/shared/lib/toast'
import type { ToastVariant } from '@/src/shared/lib/toast'

const VARIANT_STYLE: Record<ToastVariant, { bg: string; text: string; border: string }> = {
  positive: { bg: colors.positiveLight, text: colors.positive, border: '#86efac' },
  negative: { bg: colors.negativeLight, text: colors.negative, border: '#fca5a5' },
  info: { bg: colors.blue100, text: colors.brand, border: colors.blue200 },
}

const Container = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
`

const ToastEl = styled.div<{ bg: string; text: string; border: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid ${({ border }) => border};
  background: ${({ bg }) => bg};
  color: ${({ text }) => text};
  font-size: 13px;
  font-weight: 500;
  min-width: 240px;
  max-width: 360px;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`

const Msg = styled.span`
  flex: 1;
`

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  padding: 0;
  color: inherit;
  &:hover {
    opacity: 1;
  }
`

const ICON = {
  positive: Check,
  negative: Warning,
  info: Info,
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()
  if (toasts.length === 0) return null
  return (
    <Container>
      {toasts.map((t) => {
        const s = VARIANT_STYLE[t.variant]
        const Icon = ICON[t.variant]
        return (
          <ToastEl key={t.id} bg={s.bg} text={s.text} border={s.border}>
            <Icon size={16} weight="bold" />
            <Msg>{t.message}</Msg>
            <CloseBtn onClick={() => remove(t.id)}>
              <X size={14} weight="bold" />
            </CloseBtn>
          </ToastEl>
        )
      })}
    </Container>
  )
}
