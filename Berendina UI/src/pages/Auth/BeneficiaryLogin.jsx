import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
const BeneficiaryLogin = () => {
    const [nic, setNic] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/beneficiaries/nic/${nic}`);
            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('beneficiary', JSON.stringify(data));
                navigate('/beneficiary-portal');
            } else {
                alert("Invalid NIC or Beneficiary not registered.");
            }
        } catch (error) {
            alert("Login System: Unable to connect to the server. Please check your network and try again.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Beneficiary Portal</h2>
                <p>Please enter your NIC to view progress</p>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>NIC Number</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 199012345678" 
                            value={nic} 
                            onChange={(e) => setNic(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Verifying...' : 'Login'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Staff? <a href="/login">Login here</a></p>
                </div>
            </div>
        </div>
    );
};
export default BeneficiaryLogin;
