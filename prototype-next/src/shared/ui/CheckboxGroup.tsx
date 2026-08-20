'use client'

import styled from '@emotion/styled'
import { Check } from '@phosphor-icons/react'

import { colors, duration, radius } from '@/src/shared/const/tokens'

type Option = { value: string; label: string }

type Props = {
  label?: string
  required?: boolean
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  error?: string
  layout?: 'row' | 'col'
  otherKey?: string
  otherValue?: string
  onOtherChange?: (v: string) => void
  otherPlaceholder?: string
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

const Checkbox = styled.div<{ checked: boolean }>`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: ${radius[4]};
  border: 1px solid ${({ checked }) => (checked ? colors.brand : colors.n300)};
  background: ${({ checked }) => (checked ? colors.brand : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${duration.fast};
`

const OptionText = styled.span`
  font-size: 14px;
  color: ${colors.n800};
`

const OtherInput = styled.input`
  margin-top: 4px;
  height: 40px;
  padding: 0 16px;
  border-radius: ${radius[6]};
  border: 1px solid ${colors.n200};
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: ${colors.n900};
  background: ${colors.white};

  &::placeholder {
    color: ${colors.n400};
  }
  &:focus {
    border-color: ${colors.brand};
  }
`

const ErrorText = styled.p`
  font-size: 11px;
  color: ${colors.negative};
`

export default function CheckboxGroup({
  label,
  required,
  options,
  values,
  onChange,
  error,
  layout = 'col',
  otherKey,
  otherValue,
  onOtherChange,
  otherPlaceholder,
}: Props) {
  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
  }

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
          <OptionLabel key={o.value} onClick={() => toggle(o.value)}>
            <Checkbox checked={values.includes(o.value)}>
              {values.includes(o.value) && <Check size={12} weight="bold" color={colors.white} />}
            </Checkbox>
            <OptionText>{o.label}</OptionText>
          </OptionLabel>
        ))}
        {otherKey && (
          <OptionLabel onClick={() => toggle(otherKey)}>
            <Checkbox checked={values.includes(otherKey)}>
              {values.includes(otherKey) && <Check size={12} weight="bold" color={colors.white} />}
            </Checkbox>
            <OptionText>기타</OptionText>
          </OptionLabel>
        )}
      </OptionsRow>
      {otherKey && values.includes(otherKey) && onOtherChange && (
        <OtherInput
          placeholder={otherPlaceholder ?? '직접 입력'}
          value={otherValue ?? ''}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  )
}
