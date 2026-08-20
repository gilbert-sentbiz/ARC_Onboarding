'use client'

import styled from '@emotion/styled'
import { CaretDown } from '@phosphor-icons/react'
import { type SelectHTMLAttributes } from 'react'

import { colors, duration, radius } from '@/src/shared/const/tokens'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  required?: boolean
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: ${colors.n500};
`

const Required = styled.span`
  margin-left: 2px;
  color: ${colors.negative};
`

const SelectWrapper = styled.div<{ hasError: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  border-radius: ${radius[6]};
  border: 1px solid ${({ hasError }) => (hasError ? colors.negative : colors.n200)};
  background: ${colors.white};
  transition: border-color ${duration.fast};

  &:focus-within {
    border-color: ${({ hasError }) => (hasError ? colors.negative : colors.brand)};
  }
`

const StyledSelect = styled.select`
  width: 100%;
  height: 100%;
  padding: 0 40px 0 16px;
  appearance: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  line-height: 20px;
  color: ${colors.n900};
  font-family: inherit;
  cursor: pointer;
`

const CaretIcon = styled.span`
  position: absolute;
  right: 12px;
  pointer-events: none;
  display: flex;
  color: ${colors.n400};
`

const ErrorText = styled.p`
  font-size: 11px;
  line-height: 16px;
  color: ${colors.negative};
`

export default function Select({ label, required, error, options, placeholder, ...rest }: Props) {
  return (
    <Wrapper>
      {label && (
        <Label>
          {label}
          {required && <Required>*</Required>}
        </Label>
      )}
      <SelectWrapper hasError={!!error}>
        <StyledSelect {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </StyledSelect>
        <CaretIcon>
          <CaretDown size={16} />
        </CaretIcon>
      </SelectWrapper>
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  )
}
