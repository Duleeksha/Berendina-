import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Beneficiaries.css';

const Beneficiaries = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <div className="beneficiaries-layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className={`beneficiaries-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="page-header">
          <div>
            <h1>Beneficiaries</h1>
            <p>Manage and track all beneficiaries in your programs</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/beneficiary-form')}>
            + Add Beneficiary
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search beneficiaries..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="table-container">
          <table className="data-table">
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
                  <td>{beneficiary.name}</td>
                  <td>{beneficiary.contact}</td>
                  <td>{beneficiary.project}</td>
                  <td>
                    <span className={`badge ${beneficiary.status}`}>{beneficiary.status}</span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${beneficiary.progress}%` }}></div>
                    </div>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => navigate(`/beneficiary-form/${beneficiary.id}`)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Beneficiaries;
