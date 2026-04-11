import React, { useState, useEffect } from 'react';
import './ReportGenerator.css';

const ReportGenerator = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    district: '',
    project: '',
    status: ''
  });

  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Error fetching projects:", err));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:5000/api/analytics/reports?${query}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data.rows || []);
        setReportStats(data.stats || { total: 0, active: 0, inactive: 0, pending: 0 });
      }
    } catch (error) {
      console.error("Report generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type, preview = false) => {
    const params = new URLSearchParams(filters);
    if (preview) params.append('preview', 'true');
    const query = params.toString();
    window.open(`http://localhost:5000/api/analytics/export/${type}?${query}`, '_blank');
  };

  return (
    <div className="report-page-content">
      <div className="page-header">
        <div>
          <h1>Smart Report Generator</h1>
          <p>Extract, analyze, and export multi-dimensional beneficiary data.</p>
        </div>
      </div>

      {/* DASHBOARD METRICS */}
      <div className="report-metrics-grid">
        <div className="metric-card blue">
          <span className="metric-label">Total Filtered</span>
          <span className="metric-value">{reportStats.total}</span>
        </div>
        <div className="metric-card green">
          <span className="metric-label">Active Cases</span>
          <span className="metric-value">{reportStats.active}</span>
        </div>
        <div className="metric-card orange">
          <span className="metric-label">Pending Review</span>
          <span className="metric-value">{reportStats.pending}</span>
        </div>
        <div className="metric-card red">
          <span className="metric-label">Inactive</span>
          <span className="metric-value">{reportStats.inactive}</span>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      <div className="report-filter-bar">
        <form onSubmit={handleGenerate} className="filter-grid">
          <div className="filter-group">
            <label>Project</label>
            <select name="project" value={filters.project} onChange={handleFilterChange} className="modern-select">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>DS Division</label>
            <select name="district" value={filters.district} onChange={handleFilterChange} className="modern-select">
              <option value="">All DS Divisions</option>
              <option value="Ambagamuwa">Ambagamuwa</option>
              <option value="Hanguranketha">Hanguranketha</option>
              <option value="Kothmale">Kothmale</option>
              <option value="Nuwara Eliya">Nuwara Eliya</option>
              <option value="Walapane">Walapane</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="modern-select">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="modern-input" />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="modern-input" />
          </div>
          <div className="filter-group">
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: '45px' }}>
              {loading ? 'Processing...' : 'Apply Filters'}
            </button>
          </div>
        </form>

        <div className="report-actions">
           <button onClick={() => handleExport('pdf')} className="action-btn-view" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
             📥 Download PDF
           </button>
           <button onClick={() => handleExport('excel')} className="action-btn-view" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
             📊 Export Excel Sheet
           </button>
           <button onClick={() => { setFilters({startDate:'', endDate:'', district:'', project:'', status:''}); setReportData([]); setReportStats({total:0, active:0, inactive:0, pending:0}); }} className="action-btn-view" style={{ background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline' }}>
             Reset All Filters
           </button>
        </div>
      </div>

      {/* REPORT PREVIEW TABLE */}
      <div className="report-preview-container">
        <div className="preview-header">
          <h3>Report Preview</h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
            Showing {reportData.length} records based on selection
          </span>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Registration Date</th>
                <th>Beneficiary Name</th>
                <th>NIC Number</th>
                <th>Project / Program</th>
                <th>DS Division</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>
                     <div className="loading-spinner" style={{ margin: '0 auto 15px' }}></div>
                     Calculating report data...
                   </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((b, i) => (
                  <tr key={b.id || i}>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="font-medium">{b.ben_name}</td>
                    <td>{b.ben_nic}</td>
                    <td><span className="project-tag">{b.ben_project}</span></td>
                    <td>{b.ben_district}</td>
                    <td>
                      <span className={`report-status status-${(b.ben_status || 'active').toLowerCase()}`}>
                        {b.ben_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="6">
                     <div className="report-empty-state">
                        <span className="empty-icon">📊</span>
                        <p>No data matches the selected criteria.<br/>Adjust filters and click <strong>Apply Filters</strong> to generate a report.</p>
                     </div>
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

export default ReportGenerator;
