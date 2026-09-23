export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Unable to complete this request. Please try again.')
  return data as T
}
