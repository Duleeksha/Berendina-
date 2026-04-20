import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Beneficiaries.css';
// Screen for the person getting help to see their own info
const BeneficiaryPortal = () => {
    // Get the person info from the saved place
    const [beneficiary, setBeneficiary] = useState(() => {
        const stored = sessionStorage.getItem('beneficiary');
        return stored ? JSON.parse(stored) : null;
    });
    const navigate = useNavigate();
    // If no person is found, go back to login
    useEffect(() => {
        if (!beneficiary) {
            navigate('/beneficiary-login');
        }
    }, [beneficiary, navigate]);
    if (!beneficiary) return <div>Loading...</div>;
    // This is what the person sees on their screen
    return (
        <div className="beneficiary-portal-container" style={{padding: '40px', maxWidth: '1200px', margin: '0 auto'}}>
            <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                <h1>Welcome, {beneficiary.ben_name}</h1>
                <button onClick={() => { sessionStorage.removeItem('beneficiary'); navigate('/beneficiary-login'); }} className="action-btn-delete">Logout</button>
            </nav>
            <div className="portal-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
                <div className="content-card">
                    <h3>My Profile</h3>
                    <p><strong>NIC:</strong> {beneficiary.ben_nic}</p>
                    <p><strong>Project:</strong> {beneficiary.ben_project}</p>
                    <p><strong>District:</strong> {beneficiary.ben_district}</p>
                    <p><strong>Status:</strong> <span className={`status-badge status-${beneficiary.ben_status.toLowerCase()}`}>{beneficiary.ben_status}</span></p>
                </div>
                <div className="content-card">
                    <h3>My Progress</h3>
                    <div className="progress-display" style={{fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6'}}>
                        {beneficiary.ben_progress}%
                    </div>
                    <p>Keep up the good work! Your field officer will update this after every visit.</p>
                </div>
                <div className="content-card" style={{gridColumn: 'span 2'}}>
                    <h3>History & Documents</h3>
                    <p>You have <strong>{beneficiary.documents?.length || 0}</strong> document(s) uploaded in our system.</p>
                    <div style={{marginTop: '20px'}}>
                        {beneficiary.documents?.map((doc, idx) => (
                            <div key={idx} className="doc-item" style={{padding: '10px', background: '#f8fafc', marginBottom: '5px', borderRadius: '5px'}}>
                                <a href={`http://localhost:5000/${doc}`} target="_blank" rel="noreferrer">View Document {idx + 1}</a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default BeneficiaryPortal;
