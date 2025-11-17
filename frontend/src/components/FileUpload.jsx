import React from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi'
import { useFileUpload } from '../hooks/useFileUpload'
import './FileUpload.css'

export default function FileUpload() {
  // Use the custom hook with your API endpoint
  // Change this URL to match your backend endpoint
  const { files, handleUpload, removeFile, retryUpload } = useFileUpload('/api/upload')

  const onDrop = (acceptedFiles) => {
    handleUpload(acceptedFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: true 
  })

  /**
   * Format file size to human-readable format
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="file-upload-container">
      <h2 className="file-upload-title">File Upload</h2>
      
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      >
        <input {...getInputProps()} />
        <FiUpload className="dropzone-icon" />
        <p className="dropzone-text">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select files'}
        </p>
        <p className="dropzone-hint">Support for multiple file uploads</p>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="uploaded-files">
          <div className="uploaded-files-header">
            <h3 className="uploaded-files-title">Uploading Files ({files.length})</h3>
          </div>
          <div className="files-list">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                  
                  <div className="file-actions">
                    {file.status === 'uploading' && (
                      <span className="file-status uploading">
                        Uploading... {file.progress}%
                      </span>
                    )}
                    {file.status === 'complete' && (
                      <span className="file-status complete">
                        <FiCheckCircle className="complete-icon" />
                        Complete
                      </span>
                    )}
                    {file.status === 'error' && (
                      <div className="file-status-error">
                        <span className="file-status error">
                          <FiAlertCircle className="error-icon" />
                          Failed
                        </span>
                        <button 
                          onClick={() => retryUpload(file.id)}
                          className="retry-button"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    
                    {file.status === 'complete' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="remove-button"
                        title="Remove file"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${
                      file.status === 'uploading' 
                        ? 'progress-blue' 
                        : file.status === 'complete'
                        ? 'progress-green'
                        : 'progress-red'
                    }`}
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
                
                {file.error && (
                  <div className="error-message">
                    {file.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
