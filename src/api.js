import { demoApi } from './demoApi.js'

const TOKEN_KEY = 'ai_pioneer_geo_token'
export const isStaticDemo = import.meta.env.VITE_STATIC_DEMO === 'true'

export const authStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export async function api(path, options = {}) {
  if (isStaticDemo) return demoApi(path, options)
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = authStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`/api${path}`, { ...options, headers })
  if (response.status === 204) return null
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || '请求失败')
  return body
}

export function currentCustomer() {
  try {
    return JSON.parse(localStorage.getItem('ai_pioneer_geo_customer')) || { id: 1, brand: '智焰 AI', company: '智焰科技有限公司' }
  } catch {
    return { id: 1, brand: '智焰 AI', company: '智焰科技有限公司' }
  }
}

export function setCurrentCustomer(customer) {
  localStorage.setItem('ai_pioneer_geo_customer', JSON.stringify(customer))
}
