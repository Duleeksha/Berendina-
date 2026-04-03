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
          console.log('DEBUG: Officer Analytics Data:', data);
          setAnalyticsData(data);
        } else {
          console.error('API Error:', response.status);
        }

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const filteredData = (analyticsData || []).filter(item =>
    (item?.officerName || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div className="loading-spinner"></div>
              <p>Fetching performance data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((officer, index) => {
              const officerProjects = officer.projects || [];
              const isTopPerformer = index === 0 && (officerProjects.length > 0 || officer.totalVisits > 0);
              const isNewMember = officerProjects.length === 0 && (officer.totalVisits || 0) === 0;
              
              return (
                <div key={officer.officerName} className="officer-card" style={{
                  border: isTopPerformer ? '2px solid #fbbf24' : (isNewMember ? '1px dashed #3b82f6' : '1px solid #e2e8f0'),
                  borderRadius: '12px', marginBottom: '20px', overflow: 'hidden', transition: 'all 0.3s ease',
                  boxShadow: isTopPerformer ? '0 10px 15px -3px rgba(251, 191, 36, 0.1)' : 'none'
                }}>
                  <div 
                    className="officer-header" 
                    onClick={() => toggleOfficer(officer.officerName)}
                    style={{padding: '20px', background: isTopPerformer ? '#fffbeb' : (isNewMember ? '#eff6ff' : (expandedOfficer === officer.officerName ? '#f1f5f9' : '#f8fafc')), cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                      <div className="officer-avatar" style={{width: '40px', height: '40px', background: isTopPerformer ? '#fbbf24' : (isNewMember ? '#3b82f6' : '#94a3b8'), color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem'}}>
                        {(officer.officerName || 'U').charAt(0)}
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                           <strong style={{fontSize: '1.1rem', color: '#1e293b'}}>{officer.officerName || 'Unnamed Officer'}</strong>
                           {isTopPerformer && (
                             <span style={{background: '#fbbf24', color: '#78350f', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase'}}>Star Performer</span>
                           )}
                           {isNewMember && (
                             <span style={{background: '#dbeafe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase'}}>Ready to Assign</span>
                           )}
                        </div>

                        <div style={{display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#64748b'}}>
                           <span>📂 {officerProjects.length} Projects</span>
                           <span>•</span>
                           <span>🚗 {officer.totalVisits || 0} Visits</span>
                        </div>
                      </div>
                    </div>
                    <span style={{color: '#64748b', fontSize: '1.2rem'}}>{expandedOfficer === officer.officerName ? '−' : '+'}</span>
                  </div>


                  {expandedOfficer === officer.officerName && (
                    <div className="officer-details" style={{padding: '20px', background: 'white', borderTop: '1px solid #f1f5f9'}}>
                      <h4 style={{fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px'}}>Active Portfolio</h4>
                      {officerProjects.length > 0 ? officerProjects.map(project => (
                        <div key={project.name} style={{marginBottom: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9'}}>
                          <div 
                            onClick={() => toggleProject(project.name)}
                            style={{padding: '12px 15px', cursor: 'pointer', fontWeight: '600', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                          >
                            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span style={{color: '#3b82f6'}}>📁</span> {project.name || 'Untitled Project'}
                            </span>
                            <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>{expandedProject === project.name ? 'Collapse' : `View ${project.beneficiaries?.length || 0} Beneficiaries`}</span>
                          </div>
                          
                          {expandedProject === project.name && (
                            <div style={{padding: '0 15px 15px 15px', fontSize: '0.9rem'}}>
                              <div style={{height: '1px', background: '#e2e8f0', marginBottom: '10px'}}></div>
                              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                {(project.beneficiaries || []).map((ben, i) => (
                                  <li key={i} style={{padding: '8px 10px', background: 'white', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9'}}>
                                    <span style={{color: '#475569', fontWeight: '500'}}>{ben.name}</span>
                                    <span className={`status-badge ${ben.status?.toLowerCase() || 'pending'}`} style={{fontSize: '0.75rem'}}>
                                      {ben.status || 'Draft'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div style={{textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontStyle: 'italic'}}>
                          No projects currently linked via field visits.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{textAlign: 'center', padding: '60px', color: '#64748b'}}>
              <p style={{fontSize: '3rem', marginBottom: '15px'}}>👤</p>
              <h3>No Officers Found</h3>
              <p>Try adjusting your search criteria or add new officers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldOfficers;