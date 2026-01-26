import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './ReportGenerator.css';

const ReportGenerator = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    reportType: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    districts: ['all'],
    projects: ['all'],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Report generated:', formData);
  };

  return (
    <div className="report-layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className={`report-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="page-header">
          <h1>Report Generator</h1>
          <p>Generate customized reports for your organization</p>
        </div>

        <div className="report-container">
          {/* Form Section */}
          <div className="report-settings">
            <form onSubmit={handleSubmit} className="settings-form">
              <h3>Report Settings</h3>

              <div className="form-group">
                <label>Report Type</label>
                <select name="reportType" value={formData.reportType} onChange={handleChange}>
                  <option value="monthly">Monthly Report</option>
                  <option value="quarterly">Quarterly Report</option>
                  <option value="annual">Annual Report</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Districts</label>
                <select name="districts" onChange={handleChange}>
                  <option value="all">All Districts</option>
                  <option value="district-a">District A</option>
                  <option value="district-b">District B</option>
                  <option value="district-c">District C</option>
                  <option value="district-d">District D</option>
                </select>
              </div>

              <div className="form-group">
                <label>Projects</label>
                <select name="projects" onChange={handleChange}>
                  <option value="all">All Projects</option>
                  <option value="education">Education Initiative</option>
                  <option value="health">Health Program</option>
                  <option value="economic">Economic Empowerment</option>
                  <option value="water">Water & Sanitation</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary generate-btn">
                Generate Report
              </button>
            </form>
          </div>

          {/* Preview Section */}
          <div className="report-preview">
            <h3>Report Preview</h3>
            <div className="preview-content">
              <div className="preview-header">
                <h2>Berendina Development Services</h2>
                <p className="report-title">Monthly Progress Report</p>
                <p className="report-date">January 1 - January 31, 2024</p>
              </div>

              <div className="preview-section">
                <h4>Executive Summary</h4>
                <p>
                  This report provides a comprehensive overview of activities, progress, and key metrics
                  for the reporting period. The organization has successfully implemented programs across
                  multiple districts with significant impact on beneficiary communities.
                </p>
              </div>

              <div className="preview-section">
                <h4>Key Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Total Beneficiaries</span>
                    <span className="metric-value">1,248</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Projects Active</span>
                    <span className="metric-value">24</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Field Visits</span>
                    <span className="metric-value">156</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Budget Utilization</span>
                    <span className="metric-value">78%</span>
                  </div>
                </div>
              </div>

              <div className="preview-section">
                <h4>Activities Completed</h4>
                <ul>
                  <li>Conducted 156 field visits across all districts</li>
                  <li>Registered 45 new beneficiaries in education program</li>
                  <li>Distributed medical supplies to 8 healthcare centers</li>
                  <li>Completed water infrastructure projects in 3 villages</li>
                  <li>Provided training to 120 community leaders</li>
                </ul>
              </div>

              <div className="preview-footer">
                <p><strong>Report Generated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportGenerator;
