"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1"

export async function apiClient(path: string, options: RequestInit = {}) {
  // 1. Resolve Tenant from Hostname or LocalStorage
  let tenant = "default-tenant"
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    const parts = hostname.split(".")
    if (parts.length >= 2 && parts[0] !== "www" && parts[0] !== "localhost") {
      tenant = parts[0]
    } else {
      tenant = localStorage.getItem("tenant_id") || "default-tenant"
    }
  }

  // 2. Get Auth Token
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  // 3. Build Headers
  const baseHeaders: Record<string, string> = {
    "X-Tenant-ID": tenant,
  }

  if (token) {
    baseHeaders["Authorization"] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    baseHeaders["Content-Type"] = "application/json"
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    // Handle unauthorized (redirect to login)
    if (typeof window !== "undefined") {
      // window.location.href = "/auth/login"
    }
  }

  return response
}
