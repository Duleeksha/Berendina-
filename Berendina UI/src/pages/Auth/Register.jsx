import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import '../Auth/Login.css'; 
import { DS_DIVISIONS } from '../../constants/locations';
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
    employee_id: '',
    branch: '',
    job_title: '',
    gender: '',
    terms_accepted: false,
    mobileNumber: '',
    ds_division: '',
    hasVehicle: 'no',
    vehicleType: '',
    vehicleNumber: '',
    languages: [],
    emergency_contact: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Very Weak', color: '#ef4444' });
  useEffect(() => {
    const password = formData.password;
    let score = 0;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['Too Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    const colors = ['#ef4444', '#f59e0b', '#facc15', '#10b981', '#059669'];
    setPasswordStrength({
      score: (score / 4) * 100,
      label: labels[score],
      color: colors[score]
    });
  }, [formData.password]);
  const validateField = (name, value) => {
    let error = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\+94|0)?[7][0-9]{8}$/;
    switch (name) {
      case 'email':
        if (!value) error = 'Email is required';
        else if (!emailRegex.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (value.length < 8) error = 'Minimum 8 characters';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match';
        break;
      case 'mobileNumber':
      case 'emergency_contact':
        if (formData.role === 'officer' && !value) error = 'Required';
        else if (value && !phoneRegex.test(value)) error = 'Invalid (Ex: 0771234567)';
        break;
      default:
        if (!value && ['firstName', 'lastName', 'role', 'gender'].includes(name)) {
          error = 'Required';
        }
    }
    return error;
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    const error = validateField(name, newValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
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
    const newErrors = {};
    Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
    });
    if (!formData.terms_accepted) {
        alert("Please accept the Terms and Conditions to proceed.");
        return;
    }
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await axios.post('http://localhost:5000/api/auth/register', formData);
        alert('Registration Successful! Your account is pending Admin approval.');
        navigate('/login');
      } catch (error) {
        const msg = error.response?.data?.message || 'Server connection failed.';
        alert(msg);
        setErrors({ apiError: msg });
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
      alert("Please fix the errors before submitting.");
    }
  };
  const getInputClass = (name) => {
    if (errors[name]) return 'input-field invalid';
    if (formData[name] && !errors[name]) return 'input-field valid';
    return 'input-field';
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-section">
          <img src={logo} alt="Berendina Logo" className="logo-img" />
        </div>
        <h1 className="company-name">Berendina Development</h1>
        <p className="subtitle">Join the mission. Create your account.</p>
        {}
        <div className="role-cards-container">
          <div 
            className={`role-card ${formData.role === 'admin' ? 'active' : ''}`}
            onClick={() => handleChange({ target: { name: 'role', value: 'admin' } })}
          >
            <span className="role-icon">🏢</span>
            <h4>Staff Admin</h4>
            <p>HQ & Branch Staff</p>
          </div>
          <div 
            className={`role-card ${formData.role === 'officer' ? 'active' : ''}`}
            onClick={() => handleChange({ target: { name: 'role', value: 'officer' } })}
          >
            <span className="role-icon">🚜</span>
            <h4>Field Officer</h4>
            <p>Field Operations</p>
          </div>
        </div>
        {errors.role && <span className="form-error" style={{textAlign: 'center', marginBottom: '15px'}}>{errors.role}</span>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <input type="text" name="firstName" placeholder="First Name" className={getInputClass('firstName')} value={formData.firstName} onChange={handleChange} required />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <input type="text" name="lastName" placeholder="Last Name" className={getInputClass('lastName')} value={formData.lastName} onChange={handleChange} required />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
                <input type="email" name="email" placeholder="Email address" className={getInputClass('email')} value={formData.email} onChange={handleChange} required />
                {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
                <select name="gender" className={getInputClass('gender')} value={formData.gender} onChange={handleChange} required>
                    <option value="" disabled>Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
          </div>
          {}
          {formData.role === 'admin' && (
            <div className="staff-section">
                <h4 className="section-title">Staff Credentials</h4>
                <div className="form-row">
                    <div className="form-group">
                        <input type="text" name="employee_id" placeholder="Employee ID (Ex: BR-102)" className="input-field" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <input type="text" name="job_title" placeholder="Job Title" className="input-field" onChange={handleChange} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <select name="branch" className="input-field select-field" onChange={handleChange}>
                            <option value="">DS Division</option>
                            {DS_DIVISIONS.map(ds => (
                                <option key={ds} value={ds}>{ds}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
          )}
          {}
          {formData.role === 'officer' && (
            <div className="officer-section">
                <h4 className="section-title">Field Operations Info</h4>
                <div className="form-row">
                    <div className="form-group">
                        <input type="tel" name="mobileNumber" placeholder="Mobile Number" className={getInputClass('mobileNumber')} onChange={handleChange} />
                        {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
                    </div>
                    <div className="form-group">
                        <select name="ds_division" className="input-field select-field" value={formData.ds_division} onChange={handleChange}>
                            <option value="">DS Division</option>
                            {DS_DIVISIONS.map(ds => (
                                <option key={ds} value={ds}>{ds}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <select name="vehicleType" className="input-field select-field" onChange={handleChange}>
                            <option value="">Vehicle</option>
                            <option value="Motorbike">Motorbike</option>
                            <option value="Car">Car</option>
                            <option value="Three Wheel">Three Wheel</option>
                            <option value="None">None</option>
                        </select>
                    </div>
                    {formData.vehicleType && formData.vehicleType !== 'None' && (
                        <div className="form-group">
                            <input 
                                type="text" 
                                name="vehicleNumber" 
                                placeholder="Vehicle Number (Ex: CP-ABC-1234)" 
                                className="input-field" 
                                value={formData.vehicleNumber} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <input type="tel" name="emergency_contact" placeholder="Emergency Contact" className={getInputClass('emergency_contact')} onChange={handleChange} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="field-label">Languages</label>
                    <div className="checkbox-group">
                        <label className="checkbox-item"><input type="checkbox" value="Sinhala" onChange={handleLanguageChange} /> Sinhala</label>
                        <label className="checkbox-item"><input type="checkbox" value="Tamil" onChange={handleLanguageChange} /> Tamil</label>
                        <label className="checkbox-item"><input type="checkbox" value="English" onChange={handleLanguageChange} /> English</label>
                    </div>
                </div>
            </div>
          )}
          <div className="form-group">
            <div className="password-input-wrapper">
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" className={getInputClass('password')} value={formData.password} onChange={handleChange} required />
                <button 
                  type="button" 
                  className="password-toggle-icon" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>
            <div className="strength-meter-container">
                <div className="strength-bar-bg">
                    <div className="strength-bar-fill" style={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
            </div>
          </div>
          <div className="form-group">
            <input type="password" name="confirmPassword" placeholder="Confirm Password" className={getInputClass('confirmPassword')} value={formData.confirmPassword} onChange={handleChange} required />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>
          <div className="terms-container">
            <label className="checkbox-label">
                <input type="checkbox" name="terms_accepted" checked={formData.terms_accepted} onChange={handleChange} />
                I agree to the Berendina Data Privacy Policy and Staff Code of Conduct.
            </label>
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