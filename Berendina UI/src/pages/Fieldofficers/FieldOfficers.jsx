import React, { useState, useEffect } from 'react';
import './FieldOfficers.css';

const FieldOfficers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [analyticsData, setAnalyticsData] = useState([]);
  const [expandedOfficer, setExpandedOfficer] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/analytics/officer-analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const filteredData = analyticsData.filter(item =>
    item.officerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOfficer = (name) => {
    setExpandedOfficer(expandedOfficer === name ? null : name);
    setExpandedProject(null);
  };

  const toggleProject = (projectName) => {
    setExpandedProject(expandedProject === projectName ? null : projectName);
  };

  return (
    <div className="officers-page-content">
      <div className="page-header">
        <div>
          <h1>Field Officers Performance</h1>
          <p>Track assigned projects and beneficiaries for each field officer.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="search-section">
          <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
                type="text"
                placeholder="Search officers..."
                className="modern-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        <div className="analytics-list">
          {loading ? <p>Loading data...</p> : (
            filteredData.map(officer => (
              <div key={officer.officerName} className="officer-card" style={{border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden'}}>
                <div 
                  className="officer-header" 
                  onClick={() => toggleOfficer(officer.officerName)}
                  style={{padding: '15px', background: '#f8fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div className="officer-avatar">{officer.officerName.charAt(0)}</div>
                    <strong>{officer.officerName}</strong>
                  </div>
                  <span>{expandedOfficer === officer.officerName ? '▼' : '▶'}</span>
                </div>

                {expandedOfficer === officer.officerName && (
                  <div className="officer-details" style={{padding: '15px', background: 'white'}}>
                    <h4>Assigned Projects ({officer.projects.length})</h4>
                    {officer.projects.length > 0 ? officer.projects.map(project => (
                      <div key={project.name} style={{marginLeft: '20px', marginBottom: '10px', borderLeft: '2px solid #cbd5e1', paddingLeft: '15px'}}>
                        <div 
                          onClick={() => toggleProject(project.name)}
                          style={{cursor: 'pointer', fontWeight: '600', color: '#1e293b', display: 'flex', justifyContent: 'space-between'}}
                        >
                          {project.name}
                          <span>{expandedProject === project.name ? '▼' : '▶'}</span>
                        </div>
                        
                        {expandedProject === project.name && (
                          <div style={{marginTop: '10px', fontSize: '0.9rem'}}>
                            <ul style={{listStyle: 'none', padding: 0}}>
                              {project.beneficiaries.map((ben, i) => (
                                <li key={i} style={{padding: '5px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between'}}>
                                  <span>{ben.name}</span>
                                  <span className={`status-badge ${ben.status?.toLowerCase()}`}>{ben.status}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )) : <p>No projects assigned via field visits.</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldOfficers;