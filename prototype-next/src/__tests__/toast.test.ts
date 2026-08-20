import { beforeEach, describe, expect, it } from 'vitest'

import { toast, useToastStore } from '@/src/shared/lib/toast'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('useToastStore', () => {
  it('adds a toast with correct variant and message', () => {
    useToastStore.getState().add('positive', '저장되었습니다')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ variant: 'positive', message: '저장되었습니다' })
  })

  it('removes a toast by id', () => {
    useToastStore.getState().add('info', '처리 중')
    const { id } = useToastStore.getState().toasts[0]
    useToastStore.getState().remove(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('toast.negative shorthand', () => {
    toast.negative('오류가 발생했습니다')
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'negative' })
  })

  it('toast.positive shorthand', () => {
    toast.positive('완료')
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'positive' })
  })

  it('toast.info shorthand', () => {
    toast.info('알림')
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'info' })
  })
})
