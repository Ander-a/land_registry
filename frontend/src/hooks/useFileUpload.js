import { useState, useCallback } from 'react'
import axios from 'axios'

/**
 * Custom hook for handling file uploads with real-time progress tracking
 * @param {string} uploadUrl - The API endpoint to upload files to
 * @returns {Object} - Upload state and functions
 */
export const useFileUpload = (uploadUrl = '/api/upload') => {
  const [files, setFiles] = useState([])

  /**
   * Upload a single file with progress tracking
   * @param {File} file - The file to upload
   * @param {number} fileId - Unique identifier for the file
   */
  const uploadFile = useCallback(async (file, fileId) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )

          // Update progress for this specific file
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === fileId
                ? { ...f, progress: percentCompleted }
                : f
            )
          )
        },
      })

      // Mark file as complete
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId
            ? { ...f, status: 'complete', progress: 100 }
            : f
        )
      )
    } catch (error) {
      console.error('Upload failed:', error)
      
      // Mark file as failed
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      )
    }
  }, [uploadUrl])

  /**
   * Handle multiple file uploads
   * @param {File[]} acceptedFiles - Array of files to upload
   */
  const handleUpload = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
      file: file,
    }))

    setFiles((prevFiles) => [...prevFiles, ...newFiles])

    // Start uploading each file
    newFiles.forEach((fileObj) => {
      uploadFile(fileObj.file, fileObj.id)
    })
  }, [uploadFile])

  /**
   * Remove a file from the list
   * @param {number} fileId - ID of the file to remove
   */
  const removeFile = useCallback((fileId) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId))
  }, [])

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  /**
   * Retry a failed upload
   * @param {number} fileId - ID of the file to retry
   */
  const retryUpload = useCallback((fileId) => {
    const fileToRetry = files.find((f) => f.id === fileId)
    if (fileToRetry) {
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId
            ? { ...f, status: 'uploading', progress: 0, error: null }
            : f
        )
      )
      uploadFile(fileToRetry.file, fileId)
    }
  }, [files, uploadFile])

  return {
    files,
    handleUpload,
    removeFile,
    clearFiles,
    retryUpload,
  }
}
