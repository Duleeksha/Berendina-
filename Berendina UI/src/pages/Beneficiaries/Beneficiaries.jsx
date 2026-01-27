import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Beneficiaries.css';

const Beneficiaries = () => {
  const navigate = useNavigate();
  // Sidebar state eka ayin kala (Mokada App.jsx eken eka handle wenawa)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const beneficiaries = [
    { id: 1, name: 'John Doe', contact: '+256 701 234 567', project: 'Education Initiative', status: 'active', progress: 75 },
    { id: 2, name: 'Jane Smith', contact: '+256 702 345 678', project: 'Health Program', status: 'active', progress: 60 },
    { id: 3, name: 'Robert Johnson', contact: '+256 703 456 789', project: 'Economic Empowerment', status: 'inactive', progress: 40 },
    { id: 4, name: 'Maria Garcia', contact: '+256 704 567 890', project: 'Education Initiative', status: 'active', progress: 85 },
    { id: 5, name: 'David Lee', contact: '+256 705 678 901', project: 'Water & Sanitation', status: 'pending', progress: 30 },
    { id: 6, name: 'Sarah Wilson', contact: '+256 706 789 012', project: 'Health Program', status: 'active', progress: 70 },
  ];

  const filteredBeneficiaries = beneficiaries
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    // Dashboard eke layout class ekama use karanawa consistency ekata
    <div className="beneficiaries-page-content">
      
      {/* Header Section */}
      <div className="page-header">
        <div>
          <h1>Beneficiaries</h1>
          <p>Manage and track all beneficiaries in your programs</p>
        </div>
        <button className="add-btn" onClick={() => navigate('/beneficiary-form')}>
          + Add Beneficiary
        </button>
      </div>

      {/* Main Card Container */}
      <div className="content-card">
        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search beneficiaries..."
              className="modern-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="modern-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Project</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeneficiaries.map(beneficiary => (
                <tr key={beneficiary.id}>
                  <td className="font-medium">{beneficiary.name}</td>
                  <td className="text-gray">{beneficiary.contact}</td>
                  <td>{beneficiary.project}</td>
                  <td>
                    <span className={`status-pill ${beneficiary.status}`}>
                      {beneficiary.status}
                    </span>
                  </td>
                  <td>
                    <div className="progress-wrapper">
                      <div className="progress-track">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${beneficiary.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{beneficiary.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="action-btn" 
                      onClick={() => navigate(`/beneficiary-form/${beneficiary.id}`)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Beneficiaries;