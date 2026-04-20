import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BeneficiaryForm.css';
import { DS_DIVISIONS } from '../../constants/locations';
import PhoneInput from '../../components/Common/PhoneInput';
import { usePhoneValidation } from '../../hooks/usePhoneValidation';

const BeneficiaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { validatePhone } = usePhoneValidation();

  const currentUser = (() => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  })();

  const [projectList, setProjectList] = useState([]);
  const [officerList, setOfficerList] = useState([]);
  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const projParam = params.get('project');
    return {
      firstName: '',
      lastName: '',
      nic: '',
      dob: '',
      gender: '',
      contact: '',
      address: '',
      dsDivision: '',
      maritalStatus: '',
      familyMembers: '',
      monthlyIncome: '',
      occupation: '',
      project: projParam || '',
      status: 'active',
      assigned_officer_id: (currentUser?.role === 'officer' && !isEditMode) ? currentUser.id : ''
    };
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjectList(data);
        }
      } catch (error) {}
    };

    const fetchOfficers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/officers');
        if (response.ok) {
          const data = await response.json();
          setOfficerList(data);
        }
      } catch (error) {}
    };

    fetchProjects();
    fetchOfficers();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchBen = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/beneficiaries`);
          if (response.ok) {
            const data = await response.json();
            const ben = data.find(b => b.id.toString() === id);
            if (ben) setFormData(ben);
          }
        } catch (error) {
          alert("Error: Failed to load existing beneficiary data for editing.");
        }
      };
      fetchBen();
    }
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'nic') {
      const nicRegex = /^(?:[0-9]{9}[vVxX]|[0-9]{12})$/;
      if (!value) {
        setErrors(prev => ({ ...prev, nic: 'NIC is required' }));
      } else if (!nicRegex.test(value)) {
        setErrors(prev => ({ ...prev, nic: 'Invalid NIC format (Ex: 123456789V or 199912345678)' }));
      } else {
        setErrors(prev => ({ ...prev, nic: '' }));
        if (!isEditMode) checkExistingNIC(value);
      }
    }

    if (name === 'contact') {
      const phoneError = validatePhone(value);
      setErrors(prev => ({ ...prev, contact: phoneError }));
    }
  };

  const checkExistingNIC = async (nic) => {
    try {
      const response = await fetch(`http://localhost:5000/api/beneficiaries/nic/${nic}`);
      if (response.ok) {
        const existingBen = await response.json();
        alert(`This NIC is registered as this beneficiary: ${existingBen.ben_first_name} ${existingBen.ben_last_name}. Please enter another NIC.`);
        setErrors(prev => ({ ...prev, nic: 'This NIC is already registered.' }));
      }
    } catch (err) {
      console.error("NIC check failed:", err);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
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
        body: data,
      });
      if (response.ok) {
        alert(`Beneficiary ${isEditMode ? 'updated' : 'saved'} successfully!`);
        navigate('/beneficiaries');
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert("Critical Error: Failed to submit the beneficiary form. Please check your internet connection.");
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
                <label>First Name</label>
                <input type="text" name="firstName" className="modern-input" value={formData.firstName || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" className="modern-input" value={formData.lastName || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>National ID (NIC)</label>
                <input
                  type="text"
                  name="nic"
                  className={errors.nic ? "modern-input invalid" : "modern-input"}
                  value={formData.nic || ''}
                  onChange={handleChange}
                  required
                />
                {errors.nic && <span className="form-error">{errors.nic}</span>}
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
              <PhoneInput
                label="Mobile Number"
                name="contact"
                value={formData.contact || ''}
                onChange={handleChange}
                required
                error={errors.contact}
              />
              <div className="form-group">
                <label>DS Division</label>
                <select name="dsDivision" className="modern-select" value={formData.dsDivision || ''} onChange={handleChange}>
                  <option value="">Select Division</option>
                  {DS_DIVISIONS.map(ds => (
                    <option key={ds} value={ds}>{ds}</option>
                  ))}
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
            <h3>Socio-Economic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Marital Status</label>
                <select name="maritalStatus" className="modern-select" value={formData.maritalStatus || ''} onChange={handleChange}>
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Family Members</label>
                <input type="number" name="familyMembers" className="modern-input" value={formData.familyMembers || ''} onChange={handleChange} min="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Income (LKR)</label>
                <input type="number" name="monthlyIncome" className="modern-input" value={formData.monthlyIncome || ''} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label>Primary Occupation</label>
                <input type="text" name="occupation" className="modern-input" value={formData.occupation || ''} onChange={handleChange} placeholder="e.g. Farmer, Self-employed" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Supporting Documents</h3>
            <div className="form-group">
              <label>Upload Documents (JPG, PNG, PDF)</label>
              <input type="file" multiple onChange={handleFileChange} className="modern-input" style={{ padding: '10px' }} />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>Selected {selectedFiles.length} files</p>
            </div>
          </div>

          <div className="form-section">
            <h3>Project Assignment</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Assigned Project</label>
                <select name="project" className="modern-select" value={formData.project || ''} onChange={handleChange} required>
                  <option value="">Select Project</option>
                  {projectList
                    .filter(proj => proj.status === 'Active' || proj.id === formData.project_id)
                    .map((proj) => <option key={proj.id} value={proj.name}>{proj.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Field Officer</label>
                {currentUser?.role === 'officer' ? (
                  <div className="readonly-input-box" style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    borderRadius: '10px',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    👤 {currentUser.firstName} {currentUser.lastName} (Me)
                    <input type="hidden" name="assigned_officer_id" value={currentUser.id} />
                  </div>
                ) : (
                  <select
                    name="assigned_officer_id"
                    className="modern-select"
                    value={formData.assigned_officer_id || ''}
                    onChange={handleChange}
                    required
                    disabled={!formData.dsDivision}
                  >
                    <option value="">{formData.dsDivision ? 'Select Officer' : 'Select DS Division first'}</option>
                    {officerList
                      .filter(off => off.dsDivision === formData.dsDivision && off.isAvailable !== false)
                      .map((off) => (
                        <option key={off.id} value={off.id}>{off.firstName} {off.lastName}</option>
                      ))
                    }
                  </select>
                )}
                {currentUser?.role === 'admin' && formData.dsDivision && officerList.filter(off => off.dsDivision === formData.dsDivision).length === 0 && (
                  <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '5px' }}>No field officers found in this division.</p>
                )}
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
            <button type="submit" className="save-btn" disabled={!!errors.nic || !!errors.contact}>
              {isEditMode ? 'Update Beneficiary' : 'Save Beneficiary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeneficiaryForm;
