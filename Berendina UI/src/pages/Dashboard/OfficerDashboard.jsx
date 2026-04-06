import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const OfficerDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newVisitCount, setNewVisitCount] = useState(0);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUser = (() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  })();

  const fetchVisits = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/visits?officerId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setVisits(data);
        const newOnes = data.filter(v => v.is_new).length;
        setNewVisitCount(newOnes);
      }
    } catch (error) {
      console.error('Error fetching dashboard visits:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchVisits();
    }
  }, [currentUser?.id, fetchVisits]);

  const handleDismissNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/visits/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (response.ok) {
        setNewVisitCount(0);
        fetchVisits();
      }
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  };

  const handleVisitClick = (visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleBannerClick = () => {
    const newVisits = visits.filter(v => v.is_new);
    if (newVisits.length > 0) {
      setSelectedVisit(newVisits[0]);
      setIsModalOpen(true);
    }
  };

  // Process data for charts vs upcoming list
  const upcomingVisits = visits.filter(v => v.status === 'scheduled').slice(0, 5);
  
  // Dummy data for chart since we don't have historical counts in current schema easily
  const myVisitsData = [
    { name: 'Mon', visits: 2 }, { name: 'Tue', visits: 4 },
    { name: 'Wed', visits: 1 }, { name: 'Thu', visits: 5 },
    { name: 'Fri', visits: 3 }
  ];

  return (
    <div className="dashboard-content">
      
      {/* --- NOTIFICATION BANNER --- */}
      {newVisitCount > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '12px',
          marginBottom: '25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
          cursor: 'pointer'
        }}
        onClick={handleBannerClick}
        >
          <div>
            <h4 style={{margin: 0, fontSize: '16px'}}>🔔 New Visits Assigned!</h4>
            <p style={{margin: '5px 0 0', fontSize: '14px', opacity: 0.9}}>
              You have {newVisitCount} new field visit{newVisitCount > 1 ? 's' : ''} scheduled for you recently.
            </p>
          </div>
          <button 
            onClick={handleDismissNotifications}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* --- HEADER SECTION --- */}
      <div className="dashboard-header">
        <div>
          <h1>Officer Dashboard</h1>
          <p>Welcome back, {currentUser?.firstName || 'Officer'}! Here is your field summary.</p>
        </div>
        <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Assignments</h3>
            <div className="stat-value">{visits.length}</div>
            <span className="stat-meta">Lifetime visits</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Pending Visits</h3>
            <div className="stat-value">{visits.filter(v => v.status === 'scheduled').length}</div>
            <span className="stat-meta">Upcoming schedule</span>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <div className="stat-value">{visits.filter(v => v.status === 'completed').length}</div>
            <span className="stat-meta">Successfully finished</span>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="main-grid">
        
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
                <h3>My Field Visits (Weekly Summary)</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={myVisitsData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#718096'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#718096'}} />
                <Tooltip 
                    cursor={{fill: '#f7fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="visits" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-panel">
            <div className="panel-card">
                <div className="panel-header">
                    <h3>📅 Next 5 Visits</h3>
                </div>
                
                <div className="approval-list">
                    {loading ? <p>Loading visits...</p> : (
                      upcomingVisits.length > 0 ? upcomingVisits.map(visit => (
                        <div key={visit.id} className="approval-item" onClick={() => handleVisitClick(visit)} style={{cursor: 'pointer'}}>
                            <div className="user-details-row">
                                <div className="avatar-placeholder" style={{background: '#f0fdf4', color: '#16a34a'}}>
                                    📍
                                </div>
                                <div className="user-text">
                                    <h4>{visit.beneficiary}</h4>
                                    <p>{visit.address || visit.district}</p>
                                </div>
                            </div>
                            <div style={{
                                fontSize: '11px', 
                                fontWeight: 'bold', 
                                color: '#4b5563', 
                                background: '#f3f4f6', 
                                padding: '4px 8px', 
                                borderRadius: '6px',
                                textAlign: 'center',
                                minWidth: '80px'
                            }}>
                                {visit.date}
                            </div>
                        </div>
                      )) : <p>No upcoming visits.</p>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* --- BENEFICIARY INFORMATION MODAL --- */}
      {isModalOpen && selectedVisit && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '35px', borderRadius: '20px', 
            width: '90%', maxWidth: '550px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative', animation: 'modalSlideUp 0.3s ease-out'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px', border: 'none', 
                background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280', fontWeight: 'bold'
              }}
            >✕</button>

            <div style={{textAlign: 'center', marginBottom: '25px'}}>
              <div style={{
                width: '60px', height: '60px', background: '#eff6ff', color: '#2563eb',
                borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', margin: '0 auto 15px'
              }}>👥</div>
              <h2 style={{margin: 0, color: '#111827', fontSize: '24px'}}>Beneficiary Details</h2>
              <p style={{margin: '5px 0 0', color: '#6b7280'}}>Visit Information & Assignment</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px'}}>
              <div style={{background: '#f9fafb', padding: '15px', borderRadius: '12px'}}>
                <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase'}}>Name</label>
                <div style={{color: '#111827', fontWeight: 600}}>{selectedVisit.beneficiary}</div>
              </div>
              <div style={{background: '#f9fafb', padding: '15px', borderRadius: '12px'}}>
                <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase'}}>District</label>
                <div style={{color: '#111827', fontWeight: 600}}>{selectedVisit.district}</div>
              </div>
            </div>

            <div style={{background: '#f0f9ff', padding: '20px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #bae6fd'}}>
              <label style={{display: 'block', fontSize: '12px', color: '#0369a1', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase'}}>Assigned Project</label>
              <div style={{color: '#0c4a6e', fontSize: '18px', fontWeight: 700}}>
                {selectedVisit.project_name || 'No Project Assigned'}
              </div>
            </div>

            <div style={{marginBottom: '25px'}}>
              <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase'}}>Allocated Resources</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                {selectedVisit.allocated_resources && selectedVisit.allocated_resources.length > 0 ? (
                  selectedVisit.allocated_resources.map((res, i) => (
                    <span key={i} style={{
                      background: '#ecfdf5', color: '#059669', padding: '6px 12px', 
                      borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0'
                    }}>
                      📦 {res}
                    </span>
                  ))
                ) : (
                  <span style={{color: '#9ca3af', fontSize: '14px', fontStyle: 'italic'}}>No resources allocated yet.</span>
                )}
              </div>
            </div>

            <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div>
                <label style={{display: 'block', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase'}}>Visit Date</label>
                <div style={{color: '#4b5563', fontWeight: 500}}>{selectedVisit.date}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <label style={{display: 'block', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase'}}>Visit Time</label>
                <div style={{color: '#4b5563', fontWeight: 500}}>{selectedVisit.time}</div>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                width: '100%', marginTop: '25px', padding: '12px', background: '#2563eb',
                color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;