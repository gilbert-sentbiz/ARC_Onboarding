'use client'

import styled from '@emotion/styled'
import { type TextareaHTMLAttributes } from 'react'

import { colors, duration, radius } from '@/src/shared/const/tokens'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helper?: string
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

const StyledTextarea = styled.textarea<{ hasError: boolean }>`
  padding: 12px 16px;
  border-radius: ${radius[6]};
  border: 1px solid ${({ hasError }) => (hasError ? colors.negative : colors.n200)};
  background: ${colors.white};
  resize: none;
  outline: none;
  transition: border-color ${duration.fast};
  font-size: 14px;
  line-height: 20px;
  font-family: inherit;
  color: ${colors.n900};

  &::placeholder {
    color: ${colors.n400};
  }
  &:focus {
    border-color: ${({ hasError }) => (hasError ? colors.negative : colors.brand)};
  }
  &:disabled {
    background: ${colors.n150};
    border-color: ${colors.n300};
    color: ${colors.n300};
    cursor: not-allowed;
  }
`

const HelperText = styled.p<{ isError?: boolean }>`
  font-size: 11px;
  line-height: 16px;
  color: ${({ isError }) => (isError ? colors.negative : colors.n500)};
`

export default function Textarea({ label, error, helper, ...rest }: Props) {
  return (
    <Wrapper>
      {label && <Label>{label}</Label>}
      <StyledTextarea hasError={!!error} rows={3} {...rest} />
      {error && <HelperText isError>{error}</HelperText>}
      {!error && helper && <HelperText>{helper}</HelperText>}
    </Wrapper>
  )
}
