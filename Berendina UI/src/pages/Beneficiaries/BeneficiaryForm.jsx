import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BeneficiaryForm.css';

const BeneficiaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Edit karanawa nam ID eka ganna
  const isEditMode = !!id;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    project: '',
    status: 'active',
    progress: 0
  });

  // Edit mode nam data purawanna (Mock Data Example)
  useEffect(() => {
    if (isEditMode) {
      // API call ekak karala data ganna thana
      console.log("Fetching data for ID:", id);
      setFormData({
        name: 'John Doe',
        contact: '+256 701 234 567',
        project: 'Education Initiative',
        status: 'active',
        progress: 75
      });
    }
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    // Methana API call eka danna
    navigate('/beneficiaries'); // Save kala pasu apahu list ekata yanawa
  };

  return (
    <div className="form-page-content">
      {/* Header with Back Button */}
      <div className="page-header">
        <div>
          <h1>{isEditMode ? 'Edit Beneficiary' : 'Add New Beneficiary'}</h1>
          <p>Fill in the details below to {isEditMode ? 'update' : 'create'} a beneficiary profile.</p>
        </div>
        <button className="back-btn" onClick={() => navigate('/beneficiaries')}>
          ← Back to List
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="modern-input"
                  placeholder="Ex: John Doe"
                  value={formData.name} 
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input 
                  type="text" 
                  name="contact"
                  className="modern-input"
                  placeholder="Ex: +94 77 123 4567"
                  value={formData.contact} 
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Project Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Assigned Project</label>
                <select 
                  name="project" 
                  className="modern-select"
                  value={formData.project} 
                  onChange={handleChange}
                >
                  <option value="">Select Project</option>
                  <option value="Education Initiative">Education Initiative</option>
                  <option value="Health Program">Health Program</option>
                  <option value="Economic Empowerment">Economic Empowerment</option>
                  <option value="Water & Sanitation">Water & Sanitation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Current Status</label>
                <select 
                  name="status" 
                  className="modern-select"
                  value={formData.status} 
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="form-row">
               <div className="form-group full-width">
                  <label>Progress ({formData.progress}%)</label>
                  <input 
                    type="range" 
                    name="progress" 
                    min="0" 
                    max="100" 
                    className="range-input"
                    value={formData.progress} 
                    onChange={handleChange} 
                  />
               </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate('/beneficiaries')}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {isEditMode ? 'Update Beneficiary' : 'Save Beneficiary'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BeneficiaryForm;