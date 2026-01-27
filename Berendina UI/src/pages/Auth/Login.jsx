import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; 
import './Login.css';
import logo from '../../assets/berendina-logo.png'; 

// SVG Icons for Eye (Show) and Eye-Off (Hide)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const Login = ({ onLogin }) => { 
  const navigate = useNavigate();
  
  // --- Existing State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  // --- NEW STATE: Password Visibility Toggles ---
  const [showLoginPassword, setShowLoginPassword] = useState(false); // Login Page
  const [showNewPassword, setShowNewPassword] = useState(false);     // Reset Modal
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Reset Modal

  // --- Forgot Password Modal State ---
  const [showModal, setShowModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); 
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // --- Existing Login Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true); 
    setError(''); 

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password
      });
      console.log("Login Success:", response.data);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (onLogin) {
        onLogin(response.data.user);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false); 
    }
  };

  // --- Reset Password Logic Functions ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
        const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email: resetEmail });
        alert(response.data.message); 
        setResetStep(2); 
    } catch (err) {
        console.error(err);
        setModalError(err.response?.data?.message || 'Error sending OTP. Please check the email.');
    } finally {
        setModalLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
        const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
            email: resetEmail,
            otp: otp.trim()
        });
        setResetStep(3); 
    } catch (err) {
        console.error(err);
        setModalError(err.response?.data?.message || 'Invalid or Expired OTP');
    } finally {
        setModalLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setModalError("Passwords do not match");
        return;
    }
    setModalLoading(true);
    setModalError('');
    try {
        const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
            email: resetEmail,
            newPassword: newPassword
        });
        alert("Password Reset Successfully! Please Login.");
        closeModal(); 
    } catch (err) {
        console.error(err);
        setModalError(err.response?.data?.message || 'Error resetting password');
    } finally {
        setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setResetStep(1);
    setResetEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setModalError('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-section">
          <img src={logo} alt="Berendina Logo" className="logo-img" />
        </div>
        <h1 className="company-name">Berendina Development Services</h1>
        <p className="subtitle">Sign in to your account</p>

        {error && <div className="alert danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              className="input-field"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
            />
          </div>
          
          <div className="form-group">
            {/* --- UPDATED: Password Field with Eye Icon --- */}
            <div className="password-input-wrapper">
                <input
                  type={showLoginPassword ? "text" : "password"} // Dynamic Type
                  placeholder="Password"
                  className="input-field password" // Add 'password' class for padding
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-icon"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
            
            <button 
                type="button" 
                className="forgot-password-link" 
                style={{background: 'none', border: 'none', cursor: 'pointer', width: '100%'}}
                onClick={() => setShowModal(true)}
            >
              Forgot Password?
            </button>
          </div>
          
          <button type="submit" className="signin-button" disabled={loading}>
             {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        {resetStep === 1 && 'Reset Password'}
                        {resetStep === 2 && 'Enter OTP'}
                        {resetStep === 3 && 'New Password'}
                    </h2>
                    <button className="close-btn" onClick={closeModal}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="step-dots">
                        <span className={`dot ${resetStep >= 1 ? 'active' : ''}`}></span>
                        <span className={`dot ${resetStep >= 2 ? 'active' : ''}`}></span>
                        <span className={`dot ${resetStep >= 3 ? 'active' : ''}`}></span>
                    </div>

                    {modalError && <div className="alert danger">{modalError}</div>}

                    {/* STEP 1: Enter Email */}
                    {resetStep === 1 && (
                        <form onSubmit={handleSendOTP}>
                            <p>Enter your registered email address. We will send you an OTP.</p>
                            <input 
                                type="email" 
                                className="input-field" 
                                placeholder="Enter your email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required
                                style={{marginBottom: '20px'}}
                            />
                            <button type="submit" className="signin-button" disabled={modalLoading}>
                                {modalLoading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: Enter OTP */}
                    {resetStep === 2 && (
                        <form onSubmit={handleVerifyOTP}>
                            <p>Enter the 4-digit code sent to <b>{resetEmail}</b></p>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                style={{marginBottom: '20px', letterSpacing: '4px', textAlign: 'center'}}
                            />
                            <button type="submit" className="signin-button" disabled={modalLoading}>
                                {modalLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button 
                                type="button" 
                                className="forgot-password-link" 
                                style={{textAlign: 'center', marginTop: '10px', width: '100%', background: 'none', border:'none'}}
                                onClick={() => setResetStep(1)}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    {/* STEP 3: New Password (UPDATED with Eye Icons) */}
                    {resetStep === 3 && (
                        <form onSubmit={handleResetPassword}>
                            <p>Create a new strong password for your account.</p>
                            
                            {/* New Password Field */}
                            <div className="password-input-wrapper" style={{marginBottom: '15px'}}>
                                <input 
                                    type={showNewPassword ? "text" : "password"}
                                    className="input-field password" 
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button 
                                  type="button" 
                                  className="password-toggle-icon"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="password-input-wrapper" style={{marginBottom: '20px'}}>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="input-field password" 
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button 
                                  type="button" 
                                  className="password-toggle-icon"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>

                            <button type="submit" className="signin-button" disabled={modalLoading}>
                                {modalLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Login;