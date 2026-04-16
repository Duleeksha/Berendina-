import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import './ReportGenerator.css';
import { DS_DIVISIONS } from '../../constants/locations';

const ReportGenerator = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    district: '',
    project: '',
    status: '',
    reportType: 'default' // Add reportType to filters
  });

  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    avgProgress: 0,
    completed: 0,
    scheduled: 0
  });
  const [inteData, setInteData] = useState(null);
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
      
      // Handle Executive Intelligence specially
      if (filters.reportType === 'executive') {
        const response = await fetch(`http://localhost:5000/api/analytics/executive-intelligence?${query}`);
        if (response.ok) {
          const data = await response.json();
          setInteData(data);
          setReportStats({ total: data.projectHealth.length });
        }
      } else {
        const response = await fetch(`http://localhost:5000/api/analytics/reports?${query}`);
        if (response.ok) {
          const data = await response.json();
          setReportData(data.rows || []);
          setReportStats(data.stats || { total: 0 });
          setInteData(null); // Reset intelligence view
        }
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

  // Dynamic Table Headers
  const renderTableHeaders = () => {
    switch (filters.reportType) {
      case 'progress':
        return (
          <tr>
            <th>Beneficiary Name</th>
            <th>Project</th>
            <th>Progress %</th>
            <th>Last Update</th>
            <th>Comment</th>
          </tr>
        );
      case 'visits':
        return (
          <tr>
            <th>Visit Date</th>
            <th>Beneficiary</th>
            <th>Field Officer</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        );
      case 'resources':
        return (
          <tr>
            <th>Resource</th>
            <th>Type</th>
            <th>Allocated To</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        );
      case 'performance':
        return (
          <tr>
            <th>Reporting Period</th>
            <th>New Beneficiaries</th>
            <th>Currently Active</th>
            <th>Pending Review</th>
          </tr>
        );
      default:
        return (
          <tr>
            <th>Registration Date</th>
            <th>Beneficiary Name</th>
            <th>NIC Number</th>
            <th>Project / Program</th>
            <th>DS Division</th>
            <th>Status</th>
          </tr>
        );
    }
  };

  // Dynamic Table Rows
  const renderTableRows = (data, i) => {
    switch (filters.reportType) {
      // (Pre-existing renderTableRows code omitted for brevity but preserved in the tool call)
      // I'll include the actual cases here to ensure correctness.
      case 'progress':
        return (
          <tr key={data.history_id || i}>
            <td className="font-medium">{data.ben_name}</td>
            <td><span className="project-tag">{data.ben_project}</span></td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.progress_value}%`, height: '100%', background: '#2563eb' }}></div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{data.progress_value}%</span>
              </div>
            </td>
            <td>{new Date(data.update_date).toLocaleDateString()}</td>
            <td style={{ fontSize: '12px', color: '#64748b' }}>{data.comment || 'N/A'}</td>
          </tr>
        );
      case 'visits':
        return (
          <tr key={data.visit_id || i}>
            <td>{new Date(data.visit_date).toLocaleDateString()}</td>
            <td className="font-medium">{data.beneficiary_name}</td>
            <td>{data.officer_name}</td>
            <td>
              <span className={`report-status status-${(data.status || 'pending').toLowerCase()}`}>
                {data.status}
              </span>
            </td>
            <td style={{ fontSize: '12px', color: '#64748b' }}>{data.notes || 'No notes'}</td>
          </tr>
        );
      case 'resources':
        return (
          <tr key={data.resource_id || i}>
            <td className="font-medium">{data.resource_name}</td>
            <td>{data.type}</td>
            <td>{data.beneficiary_name || <span style={{color: '#94a3b8'}}>Unallocated</span>}</td>
            <td>{data.quantity}</td>
            <td>
              <span className={`report-status status-${(data.status || 'available').toLowerCase()}`}>
                {data.status}
              </span>
            </td>
          </tr>
        );
      case 'performance':
        return (
          <tr key={i}>
            <td className="font-medium">{data.period}</td>
            <td style={{ textAlign: 'center' }}>{data.total_added}</td>
            <td style={{ textAlign: 'center' }}>{data.active_now}</td>
            <td style={{ textAlign: 'center' }}>{data.pending_now}</td>
          </tr>
        );
      default:
        return (
          <tr key={data.id || i}>
            <td style={{ color: '#64748b', fontSize: '13px' }}>
              {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}
            </td>
            <td className="font-medium">{data.ben_name}</td>
            <td>{data.ben_nic}</td>
            <td><span className="project-tag">{data.ben_project}</span></td>
            <td>{data.ben_district}</td>
            <td>
              <span className={`report-status status-${(data.ben_status || 'active').toLowerCase()}`}>
                {data.ben_status}
              </span>
            </td>
          </tr>
        );
    }
  };

  const renderExecutiveDashboard = () => {
    if (!inteData) return null;

    const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="executive-dashboard">
        <div className="intelligence-grid">
          {/* Project Health Radar */}
          <div className="intel-card full-width">
            <div className="intel-header">
              <h3>Project Strategic Pulse</h3>
              <p>Aggregated beneficiary progress per social mission</p>
            </div>
            <div className="health-metrics-row">
              {inteData.projectHealth.map((p, idx) => (
                <div key={idx} className="health-indicator">
                  <div className="circular-progress" style={{ 
                    '--p': p.health_score, 
                    '--c': p.health_score > 70 ? '#10b981' : p.health_score > 40 ? '#f59e0b' : '#ef4444' 
                  }}>
                    <span className="percent">{p.health_score}%</span>
                  </div>
                  <span className="project-name">{p.name}</span>
                  <span className="total-ben">{p.beneficiary_count} Members</span>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="intel-card">
            <h3>Officer Load Heatmap</h3>
            <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
              <ResponsiveContainer>
                <BarChart data={inteData.officerLoad}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="active_cases" fill="#2563eb" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="intel-card">
            <h3>Resource Allocation Flow</h3>
            <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={inteData.resourceStats}
                    dataKey="stock"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                  >
                    {inteData.resourceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Suggested Actions Sidebar */}
          <div className="intel-card risk-panel">
            <div className="intel-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#ef4444' }}>⚠️ Strategic Risks</h3>
            </div>
            <div className="risk-metric">
              <span>Overdue Field Visits</span>
              <strong style={{ color: '#ef4444' }}>{inteData.risks.overdueVisits}</strong>
            </div>
            <div className="risk-metric">
              <span>Stagnant Progress (&gt;30 days)</span>
              <strong style={{ color: '#f59e0b' }}>{inteData.risks.stagnantBeneficiaries}</strong>
            </div>

            <div className="suggested-actions-container" style={{ marginTop: '30px' }}>
              <h4 style={{ fontSize: '14px', color: '#111827', marginBottom: '15px', borderBottom: '1px solid #eef2f6', paddingBottom: '10px' }}>
                🚀 Guided Strategic Actions
              </h4>
              <div className="action-list">
                {inteData.suggestedActions.map((action, idx) => (
                  <div key={idx} className={`suggestion-item ${action.type}`}>
                    <div className="suggestion-title">{action.title}</div>
                    <p>{action.message}</p>
                    <button className="action-trigger">Initiate: {action.suggestion}</button>
                  </div>
                ))}
                {inteData.suggestedActions.length === 0 && (
                  <p style={{ color: '#10b981', fontSize: '13px' }}>✅ No critical risks identified. Operations stable.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="report-page-content">
      <div className="page-header">
        <div>
          <h1>Smart Report Generator</h1>
          <p>Extract, analyze, and export multi-dimensional mission data.</p>
        </div>
      </div>

      {/* DASHBOARD METRICS */}
      <div className="report-metrics-grid">
        <div className="metric-card blue">
          <span className="metric-label">{filters.reportType === 'default' ? 'Total Filtered' : 'Records Found'}</span>
          <span className="metric-value">{reportStats.total}</span>
        </div>
        
        {filters.reportType === 'progress' ? (
          <div className="metric-card green">
            <span className="metric-label">Avg. Progress</span>
            <span className="metric-value">{reportStats.avgProgress}%</span>
          </div>
        ) : filters.reportType === 'visits' ? (
          <>
            <div className="metric-card green">
              <span className="metric-label">Completed Visits</span>
              <span className="metric-value">{reportStats.completed}</span>
            </div>
            <div className="metric-card orange">
              <span className="metric-label">Scheduled</span>
              <span className="metric-value">{reportStats.scheduled}</span>
            </div>
          </>
        ) : (
          <>
            <div className="metric-card green">
              <span className="metric-label">Active Cases</span>
              <span className="metric-value">{reportStats.active || 0}</span>
            </div>
            <div className="metric-card orange">
              <span className="metric-label">Pending Review</span>
              <span className="metric-value">{reportStats.pending || 0}</span>
            </div>
          </>
        )}

        <div className="metric-card red">
          <span className="metric-label">{filters.reportType === 'visits' ? 'Overdue' : 'Inactive'}</span>
          <span className="metric-value">{reportStats.inactive || 0}</span>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      <div className="report-filter-bar">
        <form onSubmit={handleGenerate} className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="filter-group">
            <label>Report Goal</label>
            <select name="reportType" value={filters.reportType} onChange={handleFilterChange} className="modern-select" style={{ border: '2px solid #2563eb', fontWeight: 'bold' }}>
              <option value="default">Beneficiary Smart List</option>
              <option value="executive">Executive Intelligence & Decisions</option>
              <option value="progress">Beneficiary Progress History</option>
              <option value="visits">Field Visit Detailed Report</option>
              <option value="resources">Resource Allocation Summary</option>
              <option value="performance">Monthly Performance Summary</option>
            </select>
          </div>
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
              {DS_DIVISIONS.map(ds => (
                <option key={ds} value={ds}>{ds}</option>
              ))}
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
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: '45px', marginTop: 'auto' }}>
              {loading ? 'Processing...' : 'Generate Report'}
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
           <button onClick={() => { setFilters({startDate:'', endDate:'', district:'', project:'', status:'', reportType: 'default'}); setReportData([]); setReportStats({total:0, active:0, inactive:0, pending:0}); }} className="action-btn-view" style={{ background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline' }}>
             Reset All Filters
           </button>
        </div>
      </div>

      {/* REPORT PREVIEW TABLE / EXECUTIVE DASHBOARD */}
      <div className="report-preview-container">
        {filters.reportType === 'executive' ? (
          renderExecutiveDashboard()
        ) : (
          <>
            <div className="preview-header">
              <h3>
                {filters.reportType === 'default' ? 'Report Preview' : 
                  filters.reportType === 'progress' ? 'Beneficiary Progress Tracking' :
                  filters.reportType === 'visits' ? 'Recent Field Visit Activity' :
                  filters.reportType === 'resources' ? 'Resource Utilization Overview' :
                  'Periodic Performance Metrics'}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                Showing {reportData.length} records based on selection
              </span>
            </div>

            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  {renderTableHeaders()}
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '50px' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 15px' }}></div>
                        Calculating report data...
                      </td>
                    </tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((data, i) => renderTableRows(data, i))
                  ) : (
                    <tr>
                      <td colSpan="10">
                        <div className="report-empty-state">
                            <span className="empty-icon">📊</span>
                            <p>No data matches the selected criteria.<br/>Adjust filters and click <strong>Generate Report</strong> to download summary.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;
