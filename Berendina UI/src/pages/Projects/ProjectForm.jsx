import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectForm.css';

const ProjectForm = () => {
  const navigate = useNavigate();

  // Form data state eka (Database columns walata match wenna)
  const [formData, setFormData] = useState({
    projectName: '',
    donorAgency: '',
    targetLocation: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'Active',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // API eken Backend ekata data yawanawa
      const response = await fetch('http://localhost:5000/api/auth/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Form eke thiyena data tika JSON karala yawanawa
      });

      if (response.ok) {
        alert("Project saved successfully!");
        navigate('/projects'); // Save unata passe auto Projects list ekata yanawa
      } else {
        const errorData = await response.json();
        alert(`Error saving project: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Failed to connect to the server. Please try again.");
    }
  };

  return (
    <div className="form-page-content">
      <div className="form-header">
        <div>
          <h1>Add New Project</h1>
          <p>Fill in the details below to create a project profile.</p>
        </div>
        <button className="back-btn" onClick={() => navigate('/projects')}>
          &larr; Back to List
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          
          <h3 className="section-title">PROJECT DETAILS</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Project Name <span className="required">*</span></label>
              <input 
                type="text" 
                name="projectName" 
                placeholder="Ex: Education Support Program" 
                value={formData.projectName} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Donor Agency</label>
              <input 
                type="text" 
                name="donorAgency" 
                placeholder="Ex: USAID, Berendina Board" 
                value={formData.donorAgency} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Target Location</label>
              <input 
                type="text" 
                name="targetLocation" 
                placeholder="Ex: Gampaha District" 
                value={formData.targetLocation} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Budget (LKR)</label>
              <input 
                type="number" 
                name="budget" 
                placeholder="Ex: 5000000" 
                value={formData.budget} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Start Date <span className="required">*</span></label>
              <input 
                type="date" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={formData.endDate} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: '30px' }}>ADDITIONAL INFORMATION</h3>
          <div className="form-group full-width">
            <label>Project Description</label>
            <textarea 
              name="description" 
              rows="4" 
              placeholder="Enter brief description about the project goals and activities..."
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/projects')}>Cancel</button>
            <button type="submit" className="btn-save">Save Project</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProjectForm;