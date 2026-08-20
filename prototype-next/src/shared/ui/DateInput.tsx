'use client'

import styled from '@emotion/styled'
import { CalendarBlank } from '@phosphor-icons/react'
import { useState } from 'react'

import { colors, duration, radius } from '@/src/shared/const/tokens'

type Props = {
  value: string
  onChange: (val: string) => void
  error?: boolean
}

const Wrapper = styled.div`
  position: relative;
`

const Display = styled.div<{ hasError: boolean; isFocused: boolean }>`
  width: 100%;
  border: 1px solid
    ${({ hasError, isFocused }) =>
      hasError ? colors.negative : isFocused ? colors.brand : colors.n200};
  border-radius: ${radius[8]};
  padding: 10px 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  transition: border-color ${duration.fast};
  background: ${colors.white};
`

const DisplayValue = styled.span<{ hasValue: boolean }>`
  color: ${({ hasValue }) => (hasValue ? colors.n800 : colors.n400)};
`

const HiddenInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`

export default function DateInput({ value, onChange, error }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <Wrapper>
      <Display hasError={!!error} isFocused={focused}>
        <DisplayValue hasValue={!!value}>{value || 'YYYY-MM-DD'}</DisplayValue>
        <CalendarBlank size={16} color={colors.n400} />
      </Display>
      <HiddenInput
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </Wrapper>
  )
}
