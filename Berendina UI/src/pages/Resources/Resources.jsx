import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Resources.css';

const Resources = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const resources = [
    { id: 1, name: 'Laptops', type: 'Equipment', quantity: 45, allocated: 38, utilization: 84, maintenance: 'Good' },
    { id: 2, name: 'Books & Training Materials', type: 'Learning', quantity: 2500, allocated: 2100, utilization: 84, maintenance: 'Good' },
    { id: 3, name: 'Medical Supplies', type: 'Health', quantity: 1200, allocated: 950, utilization: 79, maintenance: 'Needs Attention' },
    { id: 4, name: 'Water Storage Tanks', type: 'Infrastructure', quantity: 12, allocated: 10, utilization: 83, maintenance: 'Good' },
    { id: 5, name: 'Toolkits', type: 'Equipment', quantity: 85, allocated: 72, utilization: 85, maintenance: 'Good' },
    { id: 6, name: 'Office Equipment', type: 'Equipment', quantity: 35, allocated: 28, utilization: 80, maintenance: 'Good' },
  ];

  const filteredResources = resources.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAllocation = resources.reduce((sum, r) => sum + r.allocated, 0);
  const totalCapacity = resources.reduce((sum, r) => sum + r.quantity, 0);
  const avgUtilization = Math.round(
    resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length
  );

  return (
    <div className="resources-layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className={`resources-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="page-header">
          <div>
            <h1>Resources</h1>
            <p>Manage and track all organizational resources</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="resource-stats">
          <div className="stat-card">
            <div className="stat-label">Total Resources</div>
            <div className="stat-value">{totalCapacity}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Allocated</div>
            <div className="stat-value">{totalAllocation}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg. Utilization</div>
            <div className="stat-value">{avgUtilization}%</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search resources..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Resources Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Type</th>
                <th>Total</th>
                <th>Allocated</th>
                <th>Utilization</th>
                <th>Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => (
                <tr key={resource.id}>
                  <td>{resource.name}</td>
                  <td>{resource.type}</td>
                  <td>{resource.quantity}</td>
                  <td>{resource.allocated}</td>
                  <td>
                    <div className="utilization-cell">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${resource.utilization}%` }}></div>
                      </div>
                      <span className="utilization-text">{resource.utilization}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${resource.maintenance.toLowerCase().replace(/\s+/g, '-')}`}>
                      {resource.maintenance}
                    </span>
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

export default Resources;
