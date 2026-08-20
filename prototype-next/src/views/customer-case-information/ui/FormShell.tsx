'use client'

import styled from '@emotion/styled'
import { ArrowLeft } from '@phosphor-icons/react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { colors } from '@/src/shared/const/tokens'

type Props = {
  step: number
  totalSteps: number
  titles: string[]
  onBack: () => void
  onDraftSave?: () => void
  children: ReactNode
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  background: ${colors.n50};
`

const Inner = styled.div`
  width: 100%;
  max-width: 680px;
  margin-bottom: 24px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${colors.n500};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 120ms;
  &:hover {
    color: ${colors.n700};
  }
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const DraftBtn = styled.button`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.brand};
  background: none;
  border: none;
  cursor: pointer;
`

const StepLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.n500};
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  overflow: hidden;
  background: ${colors.n200};
`

const ProgressFill = styled.div<{ pct: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: width 300ms;
  background: ${colors.brand};
  width: ${({ pct }) => pct}%;
`

const Card = styled.div`
  width: 100%;
  max-width: 680px;
  background: ${colors.white};
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  box-shadow: var(--shadow-200);
`

const SectionTag = styled.p`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0 0 4px;
  color: ${colors.brand};
`

const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: ${colors.n900};
`

export default function FormShell({
  step,
  totalSteps,
  titles,
  onBack,
  onDraftSave,
  children,
}: Props) {
  const [saved, setSaved] = useState(false)

  function handleDraftSave() {
    onDraftSave?.()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Page>
      <Inner>
        <HeaderRow>
          <BackBtn type="button" onClick={onBack}>
            <ArrowLeft size={16} />
            이전
          </BackBtn>
          <HeaderRight>
            {onDraftSave && (
              <DraftBtn type="button" onClick={handleDraftSave}>
                {saved ? '저장됨 ✓' : '임시저장'}
              </DraftBtn>
            )}
            <StepLabel>
              {step + 1} / {totalSteps}
            </StepLabel>
          </HeaderRight>
        </HeaderRow>
        <ProgressTrack>
          <ProgressFill pct={((step + 1) / totalSteps) * 100} />
        </ProgressTrack>
      </Inner>

      <Card>
        <div>
          <SectionTag>2차 정보 입력</SectionTag>
          <CardTitle>{titles[step]}</CardTitle>
        </div>
        {children}
      </Card>
    </Page>
  )
}
