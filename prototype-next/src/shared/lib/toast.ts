import { create } from 'zustand'

export type ToastVariant = 'positive' | 'negative' | 'info'

export type ToastItem = {
  id: string
  variant: ToastVariant
  message: string
}

type ToastStore = {
  toasts: ToastItem[]
  add: (variant: ToastVariant, message: string) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (variant, message) => {
    const id = `t_${Date.now()}_${String(Math.random()).slice(2, 8)}`
    set((s) => ({ toasts: [...s.toasts, { id, variant, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Imperative API — mirrors company convention: toast.negative / toast.positive / toast.info
export const toast = {
  negative: (message: string) => useToastStore.getState().add('negative', message),
  positive: (message: string) => useToastStore.getState().add('positive', message),
  info: (message: string) => useToastStore.getState().add('info', message),
}
