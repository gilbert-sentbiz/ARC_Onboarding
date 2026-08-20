'use client'

import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { type InputHTMLAttributes, type ReactNode } from 'react'

import { colors, duration, radius } from '@/src/shared/const/tokens'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  required?: boolean
  error?: string
  helper?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
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
  letter-spacing: 0.07px;
  color: ${colors.n500};
`

const Required = styled.span`
  margin-left: 2px;
  color: ${colors.negative};
`

const InputWrapper = styled.div<{ hasError: boolean; isDisabled: boolean }>`
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  gap: 8px;
  border-radius: ${radius[6]};
  border: 1px solid ${({ hasError }) => (hasError ? colors.negative : colors.n200)};
  background: ${({ isDisabled }) => (isDisabled ? colors.n150 : colors.white)};
  transition: border-color ${duration.fast};
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'text')};

  &:focus-within {
    border-color: ${({ hasError }) => (hasError ? colors.negative : colors.brand)};
  }
`

const IconSlot = styled.span`
  flex-shrink: 0;
  display: flex;
  color: ${colors.n400};
`

const StyledInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  letter-spacing: 0.07px;
  color: ${colors.n900};
  font-family: inherit;

  &::placeholder {
    color: ${colors.n400};
  }
  &:disabled {
    cursor: not-allowed;
  }
`

const HelperText = styled.p<{ isError?: boolean }>`
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.055px;
  color: ${({ isError }) => (isError ? colors.negative : colors.n500)};
`

export default function Input({
  label,
  required,
  error,
  helper,
  iconLeft,
  iconRight,
  ...rest
}: Props) {
  return (
    <Wrapper>
      {label && (
        <Label>
          {label}
          {required && <Required>*</Required>}
        </Label>
      )}
      <InputWrapper hasError={!!error} isDisabled={!!rest.disabled}>
        {iconLeft && <IconSlot>{iconLeft}</IconSlot>}
        <StyledInput {...rest} />
        {iconRight && <IconSlot>{iconRight}</IconSlot>}
      </InputWrapper>
      {error && <HelperText isError>{error}</HelperText>}
      {!error && helper && <HelperText>{helper}</HelperText>}
    </Wrapper>
  )
}
