import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BeneficiaryForm.css';

const BeneficiaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Edit karanawa nam ID eka ganna
  const isEditMode = !!id;

  // Form State
  const [formData, setFormData] = useState({
    // 1. Personal Info
    name: '',
    nic: '',
    dob: '',
    gender: '',
    
    // 2. Contact & Location
    contact: '',
    address: '',
    district: '',
    dsDivision: '',

    // 3. Socio-Economic
    maritalStatus: '',
    familyMembers: '',
    monthlyIncome: '',
    occupation: '',

    // 4. Project Details
    project: '',
    status: 'active',
    progress: 0
  });

  // Edit mode nam data purawanna (Mock Data Example Updated to Match List)
  useEffect(() => {
    if (isEditMode) {
      console.log("Fetching data for ID:", id);

      // MOCK DATA: List eke thiyana nam walata galapena widihata haduwa
      const mockDatabase = {
        '1': {
            name: 'Kamal Perera',
            nic: '198512345678',
            dob: '1985-05-15',
            gender: 'Male',
            contact: '+94 71 234 5678',
            address: 'No 123, Temple Road, Gampaha',
            district: 'Gampaha',
            dsDivision: 'Mahara',
            maritalStatus: 'Married',
            familyMembers: '4',
            monthlyIncome: '45000',
            occupation: 'Farmer',
            project: 'Education Initiative',
            status: 'active',
            progress: 75
        },
        '2': {
            name: 'Nimali Silva',
            nic: '199056789123',
            dob: '1990-08-20',
            gender: 'Female',
            contact: '+94 77 345 6789',
            address: 'No 45, Main Street, Colombo',
            district: 'Colombo',
            dsDivision: 'Kaduwela',
            maritalStatus: 'Married',
            familyMembers: '3',
            monthlyIncome: '55000',
            occupation: 'Teacher',
            project: 'Health Program',
            status: 'active',
            progress: 60
        },
        '3': {
            name: 'Ruwan Bandara',
            nic: '198845678901',
            dob: '1988-02-10',
            gender: 'Male',
            contact: '+94 76 456 7890',
            address: 'No 89, Beach Road, Kalutara',
            district: 'Kalutara',
            dsDivision: 'Panadura',
            maritalStatus: 'Single',
            familyMembers: '2',
            monthlyIncome: '30000',
            occupation: 'Fisherman',
            project: 'Economic Empowerment',
            status: 'inactive',
            progress: 40
        },
        '4': {
            name: 'Kumari Jayawardena',
            nic: '199212345678',
            dob: '1992-11-05',
            gender: 'Female',
            contact: '+94 70 567 8901',
            address: 'No 12, Hill Street, Kandy',
            district: 'Kandy',
            dsDivision: 'Gangawata Korale',
            maritalStatus: 'Widowed',
            familyMembers: '3',
            monthlyIncome: '25000',
            occupation: 'Self-Employed',
            project: 'Education Initiative',
            status: 'active',
            progress: 85
        },
        '5': {
            name: 'Chaminda Rajapaksa',
            nic: '198078901234',
            dob: '1980-04-25',
            gender: 'Male',
            contact: '+94 75 678 9012',
            address: 'No 67, Galle Road, Galle',
            district: 'Galle',
            dsDivision: 'Hikkaduwa',
            maritalStatus: 'Married',
            familyMembers: '5',
            monthlyIncome: '40000',
            occupation: 'Driver',
            project: 'Water & Sanitation',
            status: 'pending',
            progress: 30
        },
        '6': {
            name: 'Dilani Fernando',
            nic: '199534567890',
            dob: '1995-09-12',
            gender: 'Female',
            contact: '+94 78 789 0123',
            address: 'No 33, Matara Road, Matara',
            district: 'Matara',
            dsDivision: 'Weligama',
            maritalStatus: 'Single',
            familyMembers: '4',
            monthlyIncome: '35000',
            occupation: 'Nurse',
            project: 'Health Program',
            status: 'active',
            progress: 70
        }
      };

      // ID ekata adala data eka gannawa, nathnam default ekak denawa
      const selectedBeneficiary = mockDatabase[id] || mockDatabase['1'];
      setFormData(selectedBeneficiary);
    }
  }, [isEditMode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debugging: Frontend eke data check karanna
    console.log("Submitting to backend:", formData);

    try {
      const response = await fetch('http://localhost:5000/api/auth/beneficiaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Meken thama Alert eka popup wenne
        alert("Beneficiary saved successfully!"); 
        navigate('/beneficiaries'); 
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to connect to the server. Backend eka run wenawada kiyala balanna.");
    }
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
          
          {/* SECTION 1: Personal Information */}
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
                <label>National ID (NIC)</label>
                <input 
                  type="text" 
                  name="nic"
                  className="modern-input"
                  placeholder="Ex: 199012345678"
                  value={formData.nic} 
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  name="dob"
                  className="modern-input"
                  value={formData.dob} 
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select 
                  name="gender" 
                  className="modern-select"
                  value={formData.gender} 
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Contact & Location */}
          <div className="form-section">
            <h3>Contact & Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
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
              <div className="form-group">
                <label>District</label>
                <select 
                  name="district" 
                  className="modern-select"
                  value={formData.district} 
                  onChange={handleChange}
                >
                  <option value="">Select District</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
                  <option value="Matara">Matara</option>
                </select>
              </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>DS Division</label>
                    <input 
                      type="text" 
                      name="dsDivision" 
                      className="modern-input"
                      placeholder="Ex: Mahara"
                      value={formData.dsDivision}
                      onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Residential Address</label>
                    <input 
                      type="text" 
                      name="address"
                      className="modern-input"
                      placeholder="House No, Street, City"
                      value={formData.address} 
                      onChange={handleChange}
                    />
                </div>
            </div>
          </div>

          {/* SECTION 3: Socio-Economic Details */}
          <div className="form-section">
            <h3>Socio-Economic Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Marital Status</label>
                <select 
                  name="maritalStatus" 
                  className="modern-select"
                  value={formData.maritalStatus} 
                  onChange={handleChange}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Family Members Count</label>
                <input 
                  type="number" 
                  name="familyMembers"
                  className="modern-input"
                  placeholder="Ex: 4"
                  value={formData.familyMembers} 
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Household Income (LKR)</label>
                <input 
                  type="number" 
                  name="monthlyIncome"
                  className="modern-input"
                  placeholder="Ex: 45000"
                  value={formData.monthlyIncome} 
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Occupation</label>
                <input 
                  type="text" 
                  name="occupation"
                  className="modern-input"
                  placeholder="Ex: Farmer, Laborer"
                  value={formData.occupation} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Project Details */}
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