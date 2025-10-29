/**
 * Centralized API client utilities
 * Consolidates common fetch patterns and auth header handling
 */

/**
 * Creates authorization headers with Bearer token
 */
export function createAuthHeaders(token: string | null): HeadersInit {
  if (!token) return {}
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  token?: string | null
  baseURL?: string
}

/**
 * Simple API client with auth header handling
 */
export class ApiClient {
  private token: string | null
  private baseURL: string

  constructor(config: ApiClientConfig = {}) {
    this.token = config.token || null
    this.baseURL = config.baseURL || (import.meta.env.VITE_API_URL || '/api')
  }

  /**
   * Update the token for authenticated requests
   */
  setToken(token: string | null) {
    this.token = token
  }

  /**
   * Build full URL with base
   */
  private buildURL(path: string): string {
    // If path already starts with baseURL, return as-is
    if (path.startsWith(this.baseURL)) return path
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${this.baseURL}/${cleanPath}`
  }

  /**
   * GET request
   */
  async get<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.buildURL(path), {
      ...options,
      method: 'GET',
      headers: {
        ...createAuthHeaders(this.token),
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * POST request
   */
  async post<T = unknown>(path: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.buildURL(path), {
      ...options,
      method: 'POST',
      headers: {
        ...createAuthHeaders(this.token),
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  /**
   * PUT request
   */
  async put<T = unknown>(path: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.buildURL(path), {
      ...options,
      method: 'PUT',
      headers: {
        ...createAuthHeaders(this.token),
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.buildURL(path), {
      ...options,
      method: 'DELETE',
      headers: {
        ...createAuthHeaders(this.token),
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }
}

/**
 * Create a default API client instance
 * Can be used for quick one-off calls
 */
export const apiClient = new ApiClient()
