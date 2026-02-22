"use client"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1"
const TOKEN_EXPIRY_SKEW_MS = 15_000

let authRedirectInProgress = false

type JWTPayload = {
  exp?: number
}

function decodeJWTPayload(token: string): JWTPayload | null {
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    return JSON.parse(atob(padded)) as JWTPayload
  } catch {
    return null
  }
}

export function isAuthTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now() + TOKEN_EXPIRY_SKEW_MS
}

function clearAuthStorage() {
  localStorage.removeItem("auth_token")
  localStorage.removeItem("user_id")
  localStorage.removeItem("user_email")
  localStorage.removeItem("user_name")
  localStorage.removeItem("user_role")
  localStorage.removeItem("user_permissions")
  localStorage.removeItem("legal_preauth_token")
  localStorage.removeItem("legal_requirements")
  localStorage.removeItem("impersonator_auth_token")
  localStorage.removeItem("impersonator_user_role")
  localStorage.removeItem("impersonator_user_id")
  localStorage.removeItem("impersonator_user_email")
  localStorage.removeItem("impersonator_user_name")
  localStorage.removeItem("impersonator_tenant_id")
  localStorage.removeItem("impersonation_started_at")
  localStorage.removeItem("impersonation_reason")
  localStorage.removeItem("impersonation_target_tenant_id")
  localStorage.removeItem("impersonation_target_user_id")
  localStorage.removeItem("impersonation_target_user_email")
}

function redirectToLogin(reason: "token_expired" | "unauthorized") {
  if (authRedirectInProgress) return

  authRedirectInProgress = true
  clearAuthStorage()

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (window.location.pathname.startsWith("/auth/login")) return

  const loginURL = new URL("/auth/login", window.location.origin)
  loginURL.searchParams.set("reason", reason)

  if (currentPath && currentPath !== "/") {
    loginURL.searchParams.set("next", currentPath)
  }

  window.location.replace(loginURL.toString())
}

function isAuthPath(path: string): boolean {
  return path.startsWith("/auth/") || path.includes("/auth/")
}

/**
 * Enhanced fetch wrapper that handles:
 * 1. Automatic Tenant ID injection from hostname or localStorage
 * 2. Automatic Authorization header injection
 * 3. Session expiry detection and redirection
 * 4. Automatic JSON parsing (returns the data object instead of Response if JSON)
 */
export async function apiClient(path: string, options: RequestInit = {}) {
  // 1. Resolve Tenant from Hostname or LocalStorage
  let tenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || ""
  if (typeof window !== "undefined") {
    const storedTenant = localStorage.getItem("tenant_id")
    if (storedTenant) {
      tenant = storedTenant
    }

    const hostname = (window.location.host || window.location.hostname || "").toLowerCase()
    const normalizedHost = hostname.split(":")[0]?.trim() || ""
    if (!tenant && normalizedHost && normalizedHost !== "localhost" && normalizedHost !== "www") {
      tenant = normalizedHost
    }
  }

  // 2. Get Auth Token
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const requestPath = path.startsWith("http") ? new URL(path).pathname : path
  const authRequest = isAuthPath(requestPath)

  // 3. Build Headers
  const baseHeaders: Record<string, string> = {}
  if (tenant) {
    baseHeaders["X-Tenant-ID"] = tenant
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

  // Handle 401s specifically for non-auth requests
  if (response.status === 401 && !authRequest && typeof window !== 'undefined') {
    // Only redirect if we have a token that is supposedly expired or rejected
    if (token) {
      redirectToLogin("unauthorized")
    }
  }

  // Automatically parse JSON for convenience if content-type is application/json
  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    const data = await response.json()

    // Create a safe proxy that doesn't shadow Response methods but allows direct data access
    const result = {
      ...data,
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      success: data.success !== undefined ? data.success : response.ok,
      json: async () => data,
      text: async () => JSON.stringify(data),
      blob: async () => response.blob(),
      formData: async () => response.formData(),
      arrayBuffer: async () => response.arrayBuffer(),
    }

    return result
  }

  return response
}
