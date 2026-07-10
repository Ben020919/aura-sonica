// 統一嘅後端 API 客戶端。
// 本機開發：BASE = ''（相對路徑），前端打 /api/...，由 vite proxy 代理去後端。
//   → 同源，冇 CORS，亦冇 localhost/IPv6 嗰類 "Failed to fetch"（見 vite.config.js）。
// 生產（Render 靜態站）：build 時設環境變數 VITE_API_URL = Render 後端網址（絕對）。
const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'aura.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    const detail = data && data.detail
    if (typeof detail === 'string') message = detail
    else if (Array.isArray(detail)) message = detail.map((d) => d.msg).join('；')
    throw new ApiError(message, res.status, data)
  }
  return data
}

// 上載檔案（multipart）—— 唔設 Content-Type，等 browser 自己加 boundary。
export async function apiUpload(path, formData) {
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method: 'POST',
    headers,
    body: formData,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    const detail = data && data.detail
    if (typeof detail === 'string') message = detail
    else if (Array.isArray(detail)) message = detail.map((d) => d.msg).join('；')
    throw new ApiError(message, res.status, data)
  }
  return data
}
