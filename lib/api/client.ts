/**
 * Core API Client
 * Centralized HTTP client with authentication, error handling, and request/response interceptors
 */

import { API_ERROR_CODES, DEFAULT_TIMEOUT, HTTP_ERROR_MESSAGES, RETRY_CONFIG } from './config'
import type { ApiResponse, ApiErrorResponse } from './types'

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(message: string, status: number, code: string = API_ERROR_CODES.INTERNAL_ERROR, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static fromResponse(response: Response, data?: ApiErrorResponse): ApiError {
    const message = data?.message || HTTP_ERROR_MESSAGES[response.status] || 'An error occurred'
    const code = data?.code || API_ERROR_CODES.INTERNAL_ERROR
    return new ApiError(message, response.status, code, data?.details)
  }

  static networkError(error: Error): ApiError {
    return new ApiError(
      'Network error - please check your connection',
      0,
      API_ERROR_CODES.NETWORK_ERROR,
      { originalError: error.message }
    )
  }
}

/**
 * Request configuration options
 */
export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  skipAuth?: boolean
}

/**
 * Token getter function type
 * This allows different auth contexts to provide their tokens
 */
type TokenGetter = () => string | null

/**
 * API Client class
 */
class ApiClient {
  private tokenGetter: TokenGetter = () => null
  private onUnauthorized: (() => void) | null = null
  private baseUrl: string = ''

  /**
   * Set the token getter function
   * Call this from your auth context to provide the token
   */
  setTokenGetter(getter: TokenGetter): void {
    this.tokenGetter = getter
  }

  /**
   * Set callback for unauthorized responses (401)
   * Use this to trigger logout or token refresh
   */
  setOnUnauthorized(callback: () => void): void {
    this.onUnauthorized = callback
  }

  /**
   * Set base URL (useful for SSR or different environments)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url
  }

  /**
   * Get the current auth token
   */
  private getToken(): string | null {
    const token = this.tokenGetter()
    if (token === 'nextauth-session') {
      return null
    }
    return token
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(config?: RequestConfig): Headers {
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    // Add auth token if available and not skipped
    if (!config?.skipAuth) {
      const token = this.getToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    // Add custom headers
    if (config?.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers.set(key, value)
      })
    }

    return headers
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint
    }
    return `${this.baseUrl}${endpoint}`
  }

  /**
   * Execute fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    url: string,
    options: RequestInit,
    config?: RequestConfig
  ): Promise<Response> {
    const maxRetries = config?.retries ?? RETRY_CONFIG.maxRetries
    const timeout = config?.timeout ?? DEFAULT_TIMEOUT
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, timeout)

        // Don't retry on successful responses or client errors (4xx except those in retryOn)
        if (response.ok || (response.status >= 400 && response.status < 500 && !RETRY_CONFIG.retryOn.includes(response.status))) {
          return response
        }

        // If status is in retryOn list and we have retries left, retry
        if (RETRY_CONFIG.retryOn.includes(response.status) && attempt < maxRetries) {
          await this.delay(RETRY_CONFIG.retryDelay * Math.pow(2, attempt))
          continue
        }

        return response
      } catch (error) {
        lastError = error as Error

        // Don't retry on abort (timeout)
        if ((error as Error).name === 'AbortError') {
          throw new ApiError('Request timed out', 408, API_ERROR_CODES.NETWORK_ERROR)
        }

        // Retry on network errors
        if (attempt < maxRetries) {
          await this.delay(RETRY_CONFIG.retryDelay * Math.pow(2, attempt))
          continue
        }
      }
    }

    throw ApiError.networkError(lastError || new Error('Request failed'))
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Parse response and handle errors
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      this.onUnauthorized?.()
    }

    // Try to parse JSON response
    let data: ApiResponse<T> | null = null
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json()
      } catch {
        // Response is not valid JSON
      }
    }

    // Handle error responses
    if (!response.ok) {
      throw ApiError.fromResponse(response, data as ApiErrorResponse)
    }

    // Handle successful response
    if (data && 'success' in data) {
      if (data.success) {
        return data.data
      } else {
        throw new ApiError(
          (data as ApiErrorResponse).message,
          response.status,
          (data as ApiErrorResponse).code
        )
      }
    }

    // Return raw data if not in standard format
    return data as T
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>, config?: RequestConfig): Promise<T> {
    let url = this.buildUrl(endpoint)

    // Add query parameters
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const response = await this.executeWithRetry(url, {
      method: 'GET',
      headers: this.buildHeaders(config),
    }, config)

    return this.parseResponse<T>(response)
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await this.executeWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(config),
      body: body ? JSON.stringify(body) : undefined,
    }, config)

    return this.parseResponse<T>(response)
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await this.executeWithRetry(url, {
      method: 'PUT',
      headers: this.buildHeaders(config),
      body: body ? JSON.stringify(body) : undefined,
    }, config)

    return this.parseResponse<T>(response)
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await this.executeWithRetry(url, {
      method: 'PATCH',
      headers: this.buildHeaders(config),
      body: body ? JSON.stringify(body) : undefined,
    }, config)

    return this.parseResponse<T>(response)
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await this.executeWithRetry(url, {
      method: 'DELETE',
      headers: this.buildHeaders(config),
    }, config)

    return this.parseResponse<T>(response)
  }

  /**
   * Upload file
   */
  async upload<T>(endpoint: string, formData: FormData, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)
    
    // Build headers without Content-Type (browser will set it with boundary)
    const headers = new Headers()
    if (!config?.skipAuth) {
      const token = this.getToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }
    if (config?.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          headers.set(key, value)
        }
      })
    }

    const response = await this.executeWithRetry(url, {
      method: 'POST',
      headers,
      body: formData,
    }, config)

    return this.parseResponse<T>(response)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing or custom instances
export { ApiClient }
