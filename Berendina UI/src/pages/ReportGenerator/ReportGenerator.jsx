import React, { useState, useEffect } from 'react';
import './ReportGenerator.css';

const ReportGenerator = () => {
  const [formData, setFormData] = useState({
    reportType: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    district: '',
    project: '',
  });

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const query = new URLSearchParams(formData).toString();
      const response = await fetch(`http://localhost:5000/api/analytics/reports?${query}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    window.open(`http://localhost:5000/api/analytics/export/${type}`, '_blank');
  };

  return (
    <div className="report-page-content">
      <div className="page-header">
        <h1>Report Generator</h1>
        <p>Generate and export customized beneficiary reports</p>
      </div>

      <div className="report-container">
        <div className="report-settings content-card">
          <form onSubmit={handleGenerate}>
            <h3>Filter Criteria</h3>
            <div className="form-group">
              <label>Project</label>
              <select name="project" value={formData.project} onChange={handleChange} className="modern-select">
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>District</label>
              <select name="district" value={formData.district} onChange={handleChange} className="modern-select">
                <option value="">All Districts</option>
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kalutara">Kalutara</option>
              </select>
            </div>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button type="submit" className="save-btn" style={{flex: 1}}>Generate Preview</button>
            </div>
            <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <button type="button" onClick={() => handleExport('pdf')} className="action-btn-view" style={{width: '100%', background: '#ef4444', color: 'white'}}>Export as PDF</button>
                <button type="button" onClick={() => handleExport('excel')} className="action-btn-view" style={{width: '100%', background: '#10b981', color: 'white'}}>Export as Excel</button>
            </div>
          </form>
        </div>

        <div className="report-preview content-card">
          <h3>Report Preview ({reportData.length} Results)</h3>
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th><th>NIC</th><th>District</th><th>Project</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5">Generating...</td></tr> : (
                  reportData.length > 0 ? reportData.map((b, i) => (
                    <tr key={i}>
                      <td>{b.ben_name}</td>
                      <td>{b.ben_nic}</td>
                      <td>{b.ben_district}</td>
                      <td>{b.ben_project}</td>
                      <td>{b.ben_status}</td>
                    </tr>
                  )) : <tr><td colSpan="5" style={{textAlign: 'center'}}>No data to display. Adjust filters and generate.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
