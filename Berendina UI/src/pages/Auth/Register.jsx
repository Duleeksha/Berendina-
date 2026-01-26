import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import '../Auth/Login.css'; 
import logo from '../../assets/berendina-logo.png';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '', 
    password: '',
    confirmPassword: '',
    organization: '',
    // --- Aluth Fields (Officer Specific) ---
    mobileNumber: '',
    dsDivision: '',
    hasVehicle: 'no',
    vehicleType: '',
    vehicleNumber: '',
    languages: [] 
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validation Logic
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    // Officer specific validation (Optional)
    if (formData.role === 'officer') {
        if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required for officers';
        if (!formData.dsDivision) newErrors.dsDivision = 'DS Division is required';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // --- Checkbox Handle Kirima (Languages) ---
  const handleLanguageChange = (e) => {
    const { value, checked } = e.target;
    const { languages } = formData;
    
    if (checked) {
      setFormData({ ...formData, languages: [...languages, value] });
    } else {
      setFormData({ ...formData, languages: languages.filter(lang => lang !== value) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Backend ekata yawana data object eka
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          organization: formData.organization,
          // Aluth Data Tika
          mobileNumber: formData.mobileNumber,
          dsDivision: formData.dsDivision,
          vehicleType: formData.hasVehicle === 'yes' ? formData.vehicleType : 'None',
          vehicleNumber: formData.hasVehicle === 'yes' ? formData.vehicleNumber : '',
          languages: formData.languages
        });

        alert('Registration Successful! Your account is pending Admin approval. You cannot login until approved.');
        navigate('/login');

      } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
          setErrors({ apiError: error.response.data.message });
          alert(error.response.data.message);
        } else {
          alert('Server connection failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-section">
          <img src={logo} alt="Berendina Logo" className="logo-img" />
        </div>
        <h1 className="company-name">Berendina Development Services</h1>
        <p className="subtitle">Create your account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <input type="text" name="firstName" placeholder="First Name" className="input-field" value={formData.firstName} onChange={handleChange} required />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <input type="text" name="lastName" placeholder="Last Name" className="input-field" value={formData.lastName} onChange={handleChange} required />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <input type="email" name="email" placeholder="Email address" className="input-field" value={formData.email} onChange={handleChange} required />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <select name="role" className="input-field select-field" value={formData.role} onChange={handleChange} required>
              <option value="" disabled>Select your role</option>
              <option value="admin">Staff Admin</option>
              <option value="officer">Field Officer</option>
            </select>
            {errors.role && <span className="form-error">{errors.role}</span>}
          </div>

          {/* --- ALUTH OFFICER SECTION EKA --- */}
          {formData.role === 'officer' && (
            <div className="officer-section">
                <h4 className="section-title">Officer Details</h4>
                
                <div className="form-row">
                    <div className="form-group">
                        <input type="tel" name="mobileNumber" placeholder="Mobile Number" className="input-field" onChange={handleChange} />
                        {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
                    </div>
                    <div className="form-group">
                        <select name="dsDivision" className="input-field select-field" onChange={handleChange}>
                            <option value="">Assigned DS Division</option>
                            <option value="Gampaha">Gampaha</option>
                            <option value="Minuwangoda">Minuwangoda</option>
                            <option value="Divulapitiya">Divulapitiya</option>
                            <option value="Wattala">Wattala</option>
                            <option value="Ja-Ela">Ja-Ela</option>
                        </select>
                        {errors.dsDivision && <span className="form-error">{errors.dsDivision}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="field-label">Do you have a personal vehicle?</label>
                    <select name="hasVehicle" value={formData.hasVehicle} onChange={handleChange} className="input-field select-field">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>

                {formData.hasVehicle === 'yes' && (
                    <div className="vehicle-details-box">
                        <div className="form-row">
                            <div className="form-group">
                                <select name="vehicleType" onChange={handleChange} className="input-field select-field">
                                    <option value="">Vehicle Type</option>
                                    <option value="Motorbike">Motorbike</option>
                                    <option value="Three-Wheeler">Three-Wheeler</option>
                                    <option value="Car">Car/Van</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <input type="text" name="vehicleNumber" placeholder="Plate No (WP ABC-1234)" className="input-field" onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="field-label">Languages Spoken</label>
                    <div className="checkbox-group">
                        <label className="checkbox-item"><input type="checkbox" value="Sinhala" onChange={handleLanguageChange} /> Sinhala</label>
                        <label className="checkbox-item"><input type="checkbox" value="Tamil" onChange={handleLanguageChange} /> Tamil</label>
                        <label className="checkbox-item"><input type="checkbox" value="English" onChange={handleLanguageChange} /> English</label>
                    </div>
                </div>
            </div>
          )}
          {/* ----------------------------------- */}

          <div className="form-group">
            <input type="text" name="organization" placeholder="Organization (Optional)" className="input-field" value={formData.organization} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input type="password" name="password" placeholder="Password" className="input-field" value={formData.password} onChange={handleChange} required />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <input type="password" name="confirmPassword" placeholder="Confirm Password" className="input-field" value={formData.confirmPassword} onChange={handleChange} required />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="signin-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;