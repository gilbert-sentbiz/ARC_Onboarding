'use client'

import styled from '@emotion/styled'

import { colors, duration } from '@/src/shared/const/tokens'

type Option = { value: string; label: string }

type Props = {
  label?: string
  required?: boolean
  options: Option[]
  value: string
  onChange: (value: string) => void
  error?: string
  layout?: 'row' | 'col'
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const FieldLabel = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: ${colors.n500};
`

const Required = styled.span`
  margin-left: 2px;
  color: ${colors.negative};
`

const OptionsRow = styled.div<{ layout: 'row' | 'col' }>`
  display: flex;
  flex-direction: ${({ layout }) => (layout === 'col' ? 'column' : 'row')};
  flex-wrap: ${({ layout }) => (layout === 'col' ? 'nowrap' : 'wrap')};
  gap: ${({ layout }) => (layout === 'col' ? '8px' : '12px')};
`

const OptionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`

const RadioDot = styled.div<{ checked: boolean }>`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid ${({ checked }) => (checked ? colors.brand : colors.n300)};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color ${duration.fast};
`

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${colors.brand};
`

const OptionText = styled.span`
  font-size: 14px;
  color: ${colors.n800};
`

const ErrorText = styled.p`
  font-size: 11px;
  color: ${colors.negative};
`

export default function RadioGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
  layout = 'row',
}: Props) {
  return (
    <Wrapper>
      {label && (
        <FieldLabel>
          {label}
          {required && <Required>*</Required>}
        </FieldLabel>
      )}
      <OptionsRow layout={layout}>
        {options.map((o) => (
          <OptionLabel key={o.value} onClick={() => onChange(o.value)}>
            <RadioDot checked={value === o.value}>{value === o.value && <Dot />}</RadioDot>
            <OptionText>{o.label}</OptionText>
          </OptionLabel>
        ))}
      </OptionsRow>
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  )
}
