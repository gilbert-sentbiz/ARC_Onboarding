import type { Case } from '@/src/shared/type'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function listCases(token: string): Promise<Case[] | null> {
  if (!API_URL) return null
  try {
    const res = await fetch(`${API_URL}/internal/cases`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return (await res.json()) as Case[]
  } catch {
    return null
  }
}
