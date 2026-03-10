// Standardized API Response format
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  code?: string
  details?: any
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export class ServiceError extends Error {
  code: string
  statusCode: number
  details?: any

  constructor(message: string, statusCode: number = 400, code: string = 'SERVICE_ERROR', details?: any) {
    super(message)
    this.name = 'ServiceError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function successResponse<T>(data: T, message?: string, status: number = 200): Response {
  return Response.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  )
}

export function errorResponse(message: string, status: number = 400, code?: string, details?: any): Response {
  return Response.json(
    {
      success: false,
      message,
      code,
      details,
    },
    { status }
  )
}

export function handleServiceError(error: unknown): Response {
  console.error('API Error:', error)

  if (error instanceof ServiceError) {
    return errorResponse(error.message, error.statusCode, error.code, error.details)
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500, 'INTERNAL_ERROR')
  }

  return errorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
}
