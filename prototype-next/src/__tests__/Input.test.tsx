import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Input from '@/src/shared/ui/Input'

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="이메일" />)
    expect(screen.getByText('이메일')).toBeInTheDocument()
  })

  it('shows required marker', () => {
    render(<Input label="이름" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input error="올바른 이메일을 입력하세요" />)
    expect(screen.getByText('올바른 이메일을 입력하세요')).toBeInTheDocument()
  })

  it('shows helper text when there is no error', () => {
    render(<Input helper="example@sentbe.com" />)
    expect(screen.getByText('example@sentbe.com')).toBeInTheDocument()
  })

  it('hides helper text when error is present', () => {
    render(<Input helper="example@sentbe.com" error="이메일이 잘못되었습니다" />)
    expect(screen.queryByText('example@sentbe.com')).not.toBeInTheDocument()
    expect(screen.getByText('이메일이 잘못되었습니다')).toBeInTheDocument()
  })

  it('renders an input element', () => {
    render(<Input placeholder="입력하세요" />)
    expect(screen.getByPlaceholderText('입력하세요')).toBeInTheDocument()
  })
})
