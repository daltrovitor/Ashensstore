// Hello World
import { getSupabaseClient } from '@/lib/supabase/client'

export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const origHeaders = (options.headers || {}) as Record<string, string>

  // Detect FormData bodies so we don't set Content-Type (browser handles it)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  // Start with provided headers (caller can override)
  const headers: Record<string, string> = { ...origHeaders }
  if (!isFormData) headers['Content-Type'] = headers['Content-Type'] || 'application/json'

  // Standard fetch with session cookies
  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'include'
  })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
} 