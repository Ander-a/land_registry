import React, { useState, useRef } from 'react';
import { FaFileAlt, FaTrash, FaDownload, FaUpload, FaFilePdf, FaFileImage, FaFileWord, FaFile, FaEye } from 'react-icons/fa';
import './DocumentManager.css';

const DocumentManager = ({ claimId, documents = [], onUpload, onDelete, readOnly = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const fileInputRef = useRef(null);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch(ext) {
      case 'pdf':
        return FaFilePdf;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return FaFileImage;
      case 'doc':
      case 'docx':
        return FaFileWord;
      default:
        return FaFile;
    }
  };

  const getFileIconColor = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch(ext) {
      case 'pdf':
        return '#ef4444';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '#3b82f6';
      case 'doc':
      case 'docx':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    if (onUpload) {
      onUpload(fileArray);
    }
  };

  const handleDelete = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      if (onDelete) {
        onDelete(docId);
      }
    }
  };

  const handleDownload = (doc) => {
    // In a real implementation, this would download from the server
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const handlePreview = (doc) => {
    setSelectedDoc(doc);
  };

  const closePreview = () => {
    setSelectedDoc(null);
  };

  return (
    <div className="document-manager">
      <div className="manager-header">
        <h3>Documents</h3>
        {!readOnly && (
          <button
            className="upload-trigger-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload /> Upload
          </button>
        )}
      </div>

      {!readOnly && (
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FaUpload className="drop-icon" />
          <p className="drop-text">
            Drag and drop files here, or <span className="drop-link">browse</span>
          </p>
          <p className="drop-hint">
            Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
      )}

      {documents.length > 0 ? (
        <div className="documents-list">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.name || doc.filename);
            const iconColor = getFileIconColor(doc.name || doc.filename);

            return (
              <div key={doc.id || doc._id} className="document-card">
                <div className="doc-icon-wrapper" style={{ color: iconColor }}>
                  <FileIcon />
                </div>

                <div className="doc-info">
                  <h4 className="doc-name">{doc.name || doc.filename}</h4>
                  <div className="doc-meta">
                    <span className="doc-size">{formatFileSize(doc.size)}</span>
                    {doc.uploaded_at && (
                      <>
                        <span className="meta-separator">•</span>
                        <span className="doc-date">{formatDate(doc.uploaded_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="doc-actions">
                  <button
                    className="doc-action-btn preview"
                    onClick={() => handlePreview(doc)}
                    title="Preview"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="doc-action-btn download"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <FaDownload />
                  </button>
                  {!readOnly && (
                    <button
                      className="doc-action-btn delete"
                      onClick={() => handleDelete(doc.id || doc._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-documents">
          <FaFileAlt className="no-docs-icon" />
          <p>No documents uploaded yet</p>
          {!readOnly && (
            <p className="no-docs-hint">Upload supporting documents to strengthen your claim</p>
          )}
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{selectedDoc.name || selectedDoc.filename}</h3>
              <button className="close-preview" onClick={closePreview}>×</button>
            </div>
            <div className="preview-body">
              {(selectedDoc.name || selectedDoc.filename).match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={selectedDoc.url || URL.createObjectURL(selectedDoc)}
                  alt={selectedDoc.name || selectedDoc.filename}
                  className="preview-image"
                />
              ) : (selectedDoc.name || selectedDoc.filename).match(/\.pdf$/i) ? (
                <iframe
                  src={selectedDoc.url || URL.createObjectURL(selectedDoc)}
                  title={selectedDoc.name || selectedDoc.filename}
                  className="preview-pdf"
                />
              ) : (
                <div className="preview-unsupported">
                  <FaFileAlt className="unsupported-icon" />
                  <p>Preview not available for this file type</p>
                  <button
                    className="download-instead-btn"
                    onClick={() => handleDownload(selectedDoc)}
                  >
                    <FaDownload /> Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
