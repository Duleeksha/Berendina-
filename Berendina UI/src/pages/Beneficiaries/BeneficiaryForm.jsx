import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BeneficiaryForm.css';

const BeneficiaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditMode = !!id;

  const [projectList, setProjectList] = useState([]);
  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const projParam = params.get('project');
    return {
      name: '', nic: '', dob: '', gender: '', contact: '', 
      address: '', district: '', dsDivision: '', maritalStatus: '', 
      familyMembers: '', monthlyIncome: '', occupation: '', 
      project: projParam || '', 
      status: 'active'
    };
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjectList(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchBen = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/auth/beneficiaries`);
          if (response.ok) {
            const data = await response.json();
            const ben = data.find(b => b.id.toString() === id);
            if (ben) setFormData(ben);
          }
        } catch (error) {
          console.error("Error loading beneficiary:", error);
        }
      };
      fetchBen();
    }
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    // Append text fields
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    // Append files
    selectedFiles.forEach(file => {
      data.append('documents', file);
    });

    const url = isEditMode 
      ? `http://localhost:5000/api/beneficiaries/${id}`
      : 'http://localhost:5000/api/beneficiaries';

    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        body: data, // No headers needed for FormData, browser sets multipart/form-data
      });

      if (response.ok) {
        alert(`Beneficiary ${isEditMode ? 'updated' : 'saved'} successfully!`);
        navigate('/beneficiaries');
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div className="form-page-content">
      <div className="page-header">
        <div>
          <h1>{isEditMode ? 'Edit Beneficiary' : 'Add New Beneficiary'}</h1>
          <p>Fill in the details below to {isEditMode ? 'update' : 'create'} a beneficiary profile.</p>
        </div>
        <button className="back-btn" onClick={() => navigate('/beneficiaries')}>← Back to List</button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" className="modern-input" value={formData.name || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>National ID (NIC)</label>
                <input type="text" name="nic" className="modern-input" value={formData.nic || ''} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" className="modern-input" value={formData.dob || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" className="modern-select" value={formData.gender || ''} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact & Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="text" name="contact" className="modern-input" value={formData.contact || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>District</label>
                <select name="district" className="modern-select" value={formData.district || ''} onChange={handleChange}>
                  <option value="">Select District</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Exact Address (Door No, Street, Village)</label>
              <input 
                type="text" 
                name="address" 
                className="modern-input" 
                value={formData.address || ''} 
                onChange={handleChange} 
                placeholder="e.g. 123, Temple Road, Gampaha" 
                required 
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Supporting Documents</h3>
            <div className="form-group">
              <label>Upload Documents (JPG, PNG, PDF)</label>
              <input type="file" multiple onChange={handleFileChange} className="modern-input" style={{padding: '10px'}} />
              <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '5px'}}>Selected {selectedFiles.length} files</p>
            </div>
          </div>

          <div className="form-section">
            <h3>Project Assignment</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Assigned Project</label>
                <select name="project" className="modern-select" value={formData.project || ''} onChange={handleChange} required>
                  <option value="">Select Project</option>
                  {projectList.map((proj) => <option key={proj.id} value={proj.name}>{proj.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Current Status</label>
                <select name="status" className="modern-select" value={formData.status || 'active'} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate('/beneficiaries')}>Cancel</button>
            <button type="submit" className="save-btn">{isEditMode ? 'Update Beneficiary' : 'Save Beneficiary'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeneficiaryForm;