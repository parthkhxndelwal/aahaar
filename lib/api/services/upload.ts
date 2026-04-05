/**
 * Upload API Service
 * Handles all file upload API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'

interface UploadResponse {
  url: string
  publicId: string
  format: string
  width?: number
  height?: number
}

export const uploadApi = {
  /**
   * Upload a file
   */
  uploadFile: (file: File, options?: { folder?: string }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.folder) {
      formData.append('folder', options.folder)
    }
    return apiClient.upload<UploadResponse>(API_ENDPOINTS.upload.base, formData)
  },

  /**
   * Upload an image
   */
  uploadImage: (file: File, options?: { folder?: string; transformation?: string }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.folder) {
      formData.append('folder', options.folder)
    }
    if (options?.transformation) {
      formData.append('transformation', options.transformation)
    }
    return apiClient.upload<UploadResponse>(API_ENDPOINTS.upload.image, formData)
  },
}
