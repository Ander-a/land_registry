import React, { useState } from 'react';
import { FaMapMarkerAlt, FaCamera, FaFileAlt, FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './ClaimSubmissionWizard.css';

const ClaimSubmissionWizard = ({ onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Location
    parcel_number: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    plot_area: '',
    coordinates: { lat: '', lng: '' },
    
    // Step 2: Evidence
    photos: [],
    witnesses: [{ name: '', contact: '' }],
    
    // Step 3: Documents
    documents: [],
    supporting_info: '',
    
    // Step 4: Review
    terms_accepted: false
  });
  
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState([]);

  const steps = [
    { id: 0, title: 'Location Details', icon: FaMapMarkerAlt },
    { id: 1, title: 'Evidence & Witnesses', icon: FaCamera },
    { id: 2, title: 'Documents', icon: FaFileAlt },
    { id: 3, title: 'Review & Submit', icon: FaCheckCircle }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCoordinateChange = (coord, value) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { ...prev.coordinates, [coord]: value }
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [...formData.photos, ...files];
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(prev => [...prev, ...previews]);
    
    setFormData(prev => ({ ...prev, photos: newPhotos }));
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleWitnessChange = (index, field, value) => {
    const newWitnesses = [...formData.witnesses];
    newWitnesses[index][field] = value;
    setFormData(prev => ({ ...prev, witnesses: newWitnesses }));
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: '', contact: '' }]
    }));
  };

  const removeWitness = (index) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch(step) {
      case 0: // Location
        if (!formData.parcel_number) newErrors.parcel_number = 'Parcel number is required';
        if (!formData.district) newErrors.district = 'District is required';
        if (!formData.sector) newErrors.sector = 'Sector is required';
        if (!formData.cell) newErrors.cell = 'Cell is required';
        if (!formData.village) newErrors.village = 'Village is required';
        if (!formData.plot_area || formData.plot_area <= 0) newErrors.plot_area = 'Valid plot area is required';
        break;
      
      case 1: // Evidence
        if (formData.photos.length === 0) newErrors.photos = 'At least one photo is required';
        if (formData.witnesses.length === 0) newErrors.witnesses = 'At least one witness is required';
        formData.witnesses.forEach((w, i) => {
          if (!w.name) newErrors[`witness_${i}_name`] = 'Witness name required';
          if (!w.contact) newErrors[`witness_${i}_contact`] = 'Witness contact required';
        });
        break;
      
      case 2: // Documents
        // Documents are optional
        break;
      
      case 3: // Review
        if (!formData.terms_accepted) newErrors.terms_accepted = 'You must accept the terms';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      await onSubmit(formData);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="wizard-step">
            <h3>Location Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Parcel Number *</label>
                <input
                  type="text"
                  value={formData.parcel_number}
                  onChange={(e) => handleInputChange('parcel_number', e.target.value)}
                  placeholder="e.g., UPI-001-234"
                  className={errors.parcel_number ? 'error' : ''}
                />
                {errors.parcel_number && <span className="error-text">{errors.parcel_number}</span>}
              </div>

              <div className="form-group">
                <label>Plot Area (m²) *</label>
                <input
                  type="number"
                  value={formData.plot_area}
                  onChange={(e) => handleInputChange('plot_area', e.target.value)}
                  placeholder="0"
                  className={errors.plot_area ? 'error' : ''}
                />
                {errors.plot_area && <span className="error-text">{errors.plot_area}</span>}
              </div>

              <div className="form-group">
                <label>District *</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="District"
                  className={errors.district ? 'error' : ''}
                />
                {errors.district && <span className="error-text">{errors.district}</span>}
              </div>

              <div className="form-group">
                <label>Sector *</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  placeholder="Sector"
                  className={errors.sector ? 'error' : ''}
                />
                {errors.sector && <span className="error-text">{errors.sector}</span>}
              </div>

              <div className="form-group">
                <label>Cell *</label>
                <input
                  type="text"
                  value={formData.cell}
                  onChange={(e) => handleInputChange('cell', e.target.value)}
                  placeholder="Cell"
                  className={errors.cell ? 'error' : ''}
                />
                {errors.cell && <span className="error-text">{errors.cell}</span>}
              </div>

              <div className="form-group">
                <label>Village *</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  placeholder="Village"
                  className={errors.village ? 'error' : ''}
                />
                {errors.village && <span className="error-text">{errors.village}</span>}
              </div>

              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.lat}
                  onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                  placeholder="-1.9403"
                />
              </div>

              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.lng}
                  onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                  placeholder="29.8739"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="wizard-step">
            <h3>Evidence & Witnesses</h3>
            
            <div className="form-section">
              <label>Land Photos *</label>
              <div className="photo-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  id="photo-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-upload" className="upload-button">
                  <FaCamera /> Choose Photos
                </label>
                {errors.photos && <span className="error-text">{errors.photos}</span>}
              </div>

              {photoPreview.length > 0 && (
                <div className="photo-preview-grid">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="photo-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <label>Witnesses *</label>
              {formData.witnesses.map((witness, index) => (
                <div key={index} className="witness-group">
                  <div className="witness-inputs">
                    <input
                      type="text"
                      placeholder="Witness Name"
                      value={witness.name}
                      onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                      className={errors[`witness_${index}_name`] ? 'error' : ''}
                    />
                    <input
                      type="text"
                      placeholder="Contact Number"
                      value={witness.contact}
                      onChange={(e) => handleWitnessChange(index, 'contact', e.target.value)}
                      className={errors[`witness_${index}_contact`] ? 'error' : ''}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        className="remove-witness"
                        onClick={() => removeWitness(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="add-witness-btn" onClick={addWitness}>
                + Add Another Witness
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step">
            <h3>Supporting Documents</h3>
            
            <div className="form-section">
              <label>Upload Documents (Optional)</label>
              <p className="helper-text">
                Upload any supporting documents such as land titles, purchase agreements, or inheritance documents.
              </p>
              
              <div className="document-upload-area">
                <input
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  id="document-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="document-upload" className="upload-button">
                  <FaFileAlt /> Choose Documents
                </label>
              </div>

              {formData.documents.length > 0 && (
                <div className="document-list">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <FaFileAlt className="doc-icon" />
                      <span className="doc-name">{doc.name}</span>
                      <span className="doc-size">
                        {(doc.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        className="remove-doc"
                        onClick={() => removeDocument(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <label>Additional Information</label>
              <textarea
                value={formData.supporting_info}
                onChange={(e) => handleInputChange('supporting_info', e.target.value)}
                placeholder="Provide any additional information about your claim..."
                rows="5"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step">
            <h3>Review Your Claim</h3>
            
            <div className="review-section">
              <h4>Location Details</h4>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Parcel Number:</span>
                  <span className="review-value">{formData.parcel_number}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Plot Area:</span>
                  <span className="review-value">{formData.plot_area} m²</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Location:</span>
                  <span className="review-value">
                    {formData.village}, {formData.cell}, {formData.sector}, {formData.district}
                  </span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h4>Evidence</h4>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Photos:</span>
                  <span className="review-value">{formData.photos.length} photo(s)</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Witnesses:</span>
                  <span className="review-value">{formData.witnesses.length} witness(es)</span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h4>Documents</h4>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Uploaded:</span>
                  <span className="review-value">
                    {formData.documents.length > 0 
                      ? `${formData.documents.length} document(s)` 
                      : 'No documents uploaded'}
                  </span>
                </div>
              </div>
            </div>

            <div className="terms-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.terms_accepted}
                  onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                />
                <span>
                  I certify that all information provided is accurate and I understand that 
                  false claims may result in legal consequences.
                </span>
              </label>
              {errors.terms_accepted && <span className="error-text">{errors.terms_accepted}</span>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2>Submit New Land Claim</h2>
          <button className="close-wizard" onClick={onClose}>×</button>
        </div>

        <div className="wizard-progress">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-step ${index === currentStep ? 'active' : ''} ${
                index < currentStep ? 'completed' : ''
              }`}
            >
              <div className="step-circle">
                {index < currentStep ? (
                  <FaCheckCircle />
                ) : (
                  <step.icon />
                )}
              </div>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>

        <div className="wizard-body">
          {renderStepContent()}
        </div>

        <div className="wizard-footer">
          <button
            className="wizard-btn btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <FaArrowLeft /> Back
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button className="wizard-btn btn-primary" onClick={handleNext}>
              Next <FaArrowRight />
            </button>
          ) : (
            <button className="wizard-btn btn-success" onClick={handleSubmit}>
              <FaCheckCircle /> Submit Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimSubmissionWizard;
