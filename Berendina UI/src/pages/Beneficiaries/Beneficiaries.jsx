import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Beneficiaries.css';

const Beneficiaries = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real data ganna states
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend API eken data ganna useEffect eka
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        // API LINK EKA WENAS KALA
        const response = await fetch('http://localhost:5000/api/auth/beneficiaries');
        if (response.ok) {
          const data = await response.json();
          setBeneficiaries(data);
        } else {
          console.error('Failed to fetch beneficiaries');
        }
      } catch (error) {
        console.error('Network error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeneficiaries();
  }, []);

  // Search filter eka
  const filteredBeneficiaries = beneficiaries.filter(ben =>
    ben.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ben.contact?.includes(searchTerm) ||
    ben.project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="officers-page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Beneficiaries</h1>
          <p>Manage and track all beneficiaries in your programs</p>
        </div>
        <button className="add-project-btn" onClick={() => navigate('/beneficiary-form')}>
          + Add Beneficiary
        </button>
      </div>

      {/* Content Card */}
      <div className="content-card">
        
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
                type="text"
                placeholder="Search beneficiaries by name, contact or project..."
                className="modern-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading beneficiaries...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>CONTACT</th>
                  <th>PROJECT</th>
                  <th>STATUS</th>
                  <th>PROGRESS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.length > 0 ? (
                  filteredBeneficiaries.map(ben => (
                    <tr key={ben.id}>
                      <td className="font-medium" style={{ color: '#1e293b' }}>{ben.name}</td>
                      <td>{ben.contact || 'N/A'}</td>
                      <td>{ben.project || 'Unassigned'}</td>
                      <td>
                        <span className={`status-badge ${ben.status ? ben.status.toLowerCase() : 'pending'}`}>
                          {ben.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${ben.progress || 0}%`, height: '100%', background: '#3b82f6' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ben.progress || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <button className="action-btn-view">Edit</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>
                      No beneficiaries found. Try adding a new beneficiary!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Beneficiaries;