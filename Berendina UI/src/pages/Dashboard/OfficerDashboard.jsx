import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const OfficerDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newVisitCount, setNewVisitCount] = useState(0);

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
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
        }}>
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
                        <div key={visit.id} className="approval-item">
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
    </div>
  );
};

export default OfficerDashboard;