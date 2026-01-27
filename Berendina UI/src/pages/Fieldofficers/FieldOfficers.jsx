import React, { useState, useEffect } from 'react';
import './FieldOfficers.css';

const FieldOfficers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // MOCK DATA: Backend eke 'user_table' eken ena officers la.
  // Status 'Active' aya witharai methana pennanne (Admin Approve karapu aya).
  const [officers, setOfficers] = useState([
    { id: 1, firstName: 'Kamal', lastName: 'Perera', email: 'kamal@example.com', mobile: '0771234567', district: 'Gampaha', status: 'Active' },
    { id: 2, firstName: 'Nimal', lastName: 'Silva', email: 'nimal@example.com', mobile: '0719876543', district: 'Colombo', status: 'Active' },
    { id: 3, firstName: 'Sunil', lastName: 'Fernando', email: 'sunil@example.com', mobile: '0765551234', district: 'Kandy', status: 'Active' },
  ]);

  // Search Logic
  const filteredOfficers = officers.filter(officer =>
    officer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <table className="modern-table">
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Email Address</th>
                <th>Contact Number</th>
                <th>District / Division</th>
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
                          {officer.firstName.charAt(0)}{officer.lastName.charAt(0)}
                        </div>
                        {officer.firstName} {officer.lastName}
                      </div>
                    </td>
                    <td className="text-gray">{officer.email}</td>
                    <td>{officer.mobile}</td>
                    <td>{officer.district || 'Not Assigned'}</td>
                    <td>
                      <span className="status-badge active">
                        {officer.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn-view">View Details</button>
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
        </div>
      </div>
    </div>
  );
};

export default FieldOfficers;