import React, { useState, useEffect } from 'react';
import './FieldOfficers.css';

const FieldOfficers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal (Popup) eka wenuwen hadapu aluth states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  useEffect(() => {
    const fetchActiveOfficers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/officers');
        if (response.ok) {
          const data = await response.json();
          setOfficers(data);
        } else {
          console.error('Failed to fetch officers');
        }
      } catch (error) {
        console.error('Network error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOfficers();
  }, []);

  const filteredOfficers = officers.filter(officer =>
    (officer.firstName && officer.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (officer.lastName && officer.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (officer.email && officer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // "View Details" button eka ebuwama meka wada karanawa
  const handleViewDetails = (officer) => {
    setSelectedOfficer(officer);
    setIsModalOpen(true);
  };

  // Popup eka close karana function eka
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOfficer(null);
  };

  return (
    <div className="officers-page-content">
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Field Officers</h1>
          <p>List of approved and active field officers in the system.</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="content-card">
        
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
                type="text"
                placeholder="Search officers by name or email..."
                className="modern-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading officers data...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Email Address</th>
                  <th>Contact Number</th>
                  <th>DS Division</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.length > 0 ? (
                  filteredOfficers.map(officer => (
                    <tr key={officer.id}>
                      <td className="font-medium">
                        <div className="officer-name-cell">
                          <div className="officer-avatar">
                            {officer.firstName ? officer.firstName.charAt(0).toUpperCase() : ''}
                            {officer.lastName ? officer.lastName.charAt(0).toUpperCase() : ''}
                          </div>
                          {officer.firstName} {officer.lastName}
                        </div>
                      </td>
                      <td className="text-gray">{officer.email}</td>
                      <td>{officer.mobile || 'N/A'}</td>
                      <td>{officer.district || 'Not Assigned'}</td>
                      <td>
                        <span className="status-badge active">
                          {officer.status}
                        </span>
                      </td>
                      <td>
                        {/* METHANA BUTTON ACTION EKA DAMMA */}
                        <button 
                          className="action-btn-view" 
                          onClick={() => handleViewDetails(officer)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>
                      No active field officers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL (POPUP) EKA METHANA LIKA THIYENNE */}
      {isModalOpen && selectedOfficer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Officer Full Details</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Full Name</label>
                <p>{selectedOfficer.firstName} {selectedOfficer.lastName}</p>
              </div>
              <div className="detail-group">
                <label>Email Address</label>
                <p>{selectedOfficer.email}</p>
              </div>
              <div className="detail-group">
                <label>Contact Number</label>
                <p>{selectedOfficer.mobile}</p>
              </div>
              <div className="detail-group">
                <label>DS Division</label>
                <p>{selectedOfficer.district}</p>
              </div>
              <div className="detail-group">
                <label>Vehicle Type</label>
                <p>{selectedOfficer.vehicleType || 'None'}</p>
              </div>
              <div className="detail-group">
                <label>Vehicle Number</label>
                <p>{selectedOfficer.vehicleNo || 'N/A'}</p>
              </div>
              <div className="detail-group">
                <label>Languages Spoken</label>
                <p>{selectedOfficer.languages || 'N/A'}</p>
              </div>
              <div className="detail-group">
                <label>Current Status</label>
                <p><span className="status-badge active">{selectedOfficer.status}</span></p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FieldOfficers;