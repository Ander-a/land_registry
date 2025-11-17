import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiCheckCircle } from 'react-icons/fi'
import './FileUpload.css'

export default function FileUpload() {
  const [files, setFiles] = useState([])

  const simulateUpload = (fileId) => {
    const interval = setInterval(() => {
      setFiles((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id === fileId) {
            const newProgress = file.progress + 10
            
            if (newProgress >= 100) {
              clearInterval(interval)
              return { ...file, progress: 100, status: 'complete' }
            }
            
            return { ...file, progress: newProgress }
          }
          return file
        })
      )
    }, 200)
  }

  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      progress: 0,
      status: 'uploading'
    }))

    setFiles((prevFiles) => [...prevFiles, ...newFiles])

    // Start upload simulation for each new file
    newFiles.forEach((file) => {
      simulateUpload(file.id)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

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
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="uploaded-files">
          <h3 className="uploaded-files-title">Uploaded Files</h3>
          <div className="files-list">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  {file.status === 'uploading' && (
                    <span className="file-status uploading">Uploading...</span>
                  )}
                  {file.status === 'complete' && (
                    <span className="file-status complete">
                      <FiCheckCircle className="complete-icon" />
                      Complete
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${
                      file.status === 'uploading' ? 'progress-blue' : 'progress-green'
                    }`}
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
