'use client'

import styled from '@emotion/styled'
import { useIsFetching } from '@tanstack/react-query'

import { colors } from '@/src/shared/const/tokens'

const Bar = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: ${colors.brand};
  z-index: 9999;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 200ms;
`

export function GlobalLoadingBar() {
  const isFetching = useIsFetching()
  return <Bar visible={isFetching > 0} />
}
