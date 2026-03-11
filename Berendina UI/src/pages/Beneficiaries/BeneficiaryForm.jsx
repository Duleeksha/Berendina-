import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BeneficiaryForm.css';

const BeneficiaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditMode = !!id;

  // --- NEW: Project List State ---
  const [projectList, setProjectList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    dob: '',
    gender: '',
    contact: '',
    address: '',
    district: '',
    dsDivision: '',
    maritalStatus: '',
    familyMembers: '',
    monthlyIncome: '',
    occupation: '',
    project: '', // Meka dropdown eken dynamic wenawa
    status: 'active',
    progress: 0
  });

  // 1. Fetch Real Projects from Backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/projects');
        if (response.ok) {
          const data = await response.json();
          setProjectList(data); // Projects tika load wenawa
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // 2. Edit mode nam data purawanna
  useEffect(() => {
    if (isEditMode) {
      console.log("Fetching data for ID:", id);
      const mockDatabase = {
        '1': { name: 'Kamal Perera', nic: '198512345678', dob: '1985-05-15', gender: 'Male', contact: '+94 71 234 5678', address: 'No 123, Temple Road, Gampaha', district: 'Gampaha', dsDivision: 'Mahara', maritalStatus: 'Married', familyMembers: '4', monthlyIncome: '45000', occupation: 'Farmer', project: 'Education Initiative', status: 'active', progress: 75 },
      };
      const selectedBeneficiary = mockDatabase[id] || mockDatabase['1'];
      setFormData(selectedBeneficiary);
    }
  }, [isEditMode, id]);

  const validateForm = () => {
    const { name, nic, dob, contact, district, project } = formData;
    if (!name.trim()) return "Full Name is required.";
    const nicRegex = /^(?:\d{9}[vVxX]|\d{12})$/;
    if (nic && !nicRegex.test(nic)) return "Invalid NIC format.";
    const today = new Date().toISOString().split('T')[0];
    if (dob && dob > today) return "Date of Birth cannot be in the future.";
    const phoneRegex = /^(?:\+94|0)?[7][0-9]{8}$/;
    if (!contact.trim()) return "Mobile Number is required.";
    if (!phoneRegex.test(contact)) return "Invalid Mobile Number.";
    if (!district) return "Please select a District.";
    if (!project) return "Please assign a Project.";
    return null; 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMessage = validateForm();
    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Beneficiary saved successfully!"); 
        navigate('/beneficiaries'); 
      } else {
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
          {/* Section 1: Personal Info */}
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" className="modern-input" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>National ID (NIC)</label>
                <input type="text" name="nic" className="modern-input" value={formData.nic} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" className="modern-input" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" className="modern-select" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="form-section">
            <h3>Contact & Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="text" name="contact" className="modern-input" value={formData.contact} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>District</label>
                <select name="district" className="modern-select" value={formData.district} onChange={handleChange}>
                  <option value="">Select District</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Socio-Economic */}
          <div className="form-section">
            <h3>Socio-Economic Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Marital Status</label>
                <select name="maritalStatus" className="modern-select" value={formData.maritalStatus} onChange={handleChange}>
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monthly Household Income (LKR)</label>
                <input type="number" name="monthlyIncome" className="modern-input" value={formData.monthlyIncome} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Section 4: Project Assignment (DYNAMIC UPDATED) */}
          <div className="form-section">
            <h3>Project Assignment</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Assigned Project</label>
                <select 
                  name="project" 
                  className="modern-select" 
                  value={formData.project} 
                  onChange={handleChange}
                  required
                  style={{ border: '1px solid #3b82f6' }}
                >
                  <option value="">Select Project</option>
                  
                  {/* --- NEW: Dynamic Project Mapping --- */}
                  {projectList.map((proj) => (
                    <option key={proj.id} value={proj.name}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Current Status</label>
                <select name="status" className="modern-select" value={formData.status} onChange={handleChange}>
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