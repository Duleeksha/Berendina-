import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css'; // Admin CSS ekama use karanawa

const OfficerDashboard = () => {
  // --- Data Tika Ehemamai (No Changes) ---
  const myVisitsData = [
    { name: 'Mon', visits: 2 }, { name: 'Tue', visits: 4 },
    { name: 'Wed', visits: 1 }, { name: 'Thu', visits: 5 },
    { name: 'Fri', visits: 3 }
  ];

  const upcomingVisits = [
    { id: 1, beneficiary: 'Kamal Perera', location: 'Gampaha', date: '2024-02-15' },
    { id: 2, beneficiary: 'Nimali Silva', location: 'Wattala', date: '2024-02-16' },
    { id: 3, beneficiary: 'Sunil Rathnayake', location: 'Ja-Ela', date: '2024-02-18' },
  ];

  return (
    // Admin Dashboard eke class ekama use karanawa layout eka full-screen ganna
    <div className="dashboard-content">
      
      {/* --- HEADER SECTION --- */}
      <div className="dashboard-header">
        <div>
          <h1>Officer Dashboard</h1>
          <p>Welcome back! Here is your field summary.</p>
        </div>
        <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* --- STATS CARDS (Using Admin Styles) --- */}
      <div className="stats-grid">
        {/* Card 1: My Beneficiaries */}
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>My Beneficiaries</h3>
            <div className="stat-value">45</div>
            <span className="stat-meta">Assigned to you</span>
          </div>
        </div>

        {/* Card 2: Pending Visits */}
        <div className="stat-card orange">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Pending Visits</h3>
            <div className="stat-value">8</div>
            <span className="stat-meta">This week</span>
          </div>
        </div>

        {/* Card 3: Resources */}
        <div className="stat-card purple">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Resources</h3>
            <div className="stat-value">12</div>
            <span className="stat-meta">Items Distributed</span>
          </div>
        </div>
        
        {/* 4 weni card ekak nathi nisa layout eka balance wenna nikan thiyanawa ho 
            anagathaye aluth stat ekak methanata danna puluwan */}
      </div>

      {/* --- MAIN GRID (Charts & Lists) --- */}
      <div className="main-grid">
        
        {/* LEFT COLUMN: Charts */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
                <h3>My Field Visits (This Week)</h3>
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

        {/* RIGHT COLUMN: Upcoming Visits List */}
        <div className="side-panel">
            <div className="panel-card">
                <div className="panel-header">
                    <h3>📅 Upcoming Visits</h3>
                </div>
                
                {/* List eka Admin list eka wagema lassana karamu */}
                <div className="approval-list">
                    {upcomingVisits.map(visit => (
                        <div key={visit.id} className="approval-item">
                            <div className="user-details-row">
                                {/* Icon for Location/User */}
                                <div className="avatar-placeholder" style={{background: '#f0fdf4', color: '#16a34a'}}>
                                    📍
                                </div>
                                <div className="user-text">
                                    <h4>{visit.beneficiary}</h4>
                                    <p>{visit.location}</p>
                                </div>
                            </div>
                            <div style={{
                                fontSize: '12px', 
                                fontWeight: 'bold', 
                                color: '#4b5563', 
                                background: '#f3f4f6', 
                                padding: '4px 8px', 
                                borderRadius: '6px',
                                textAlign: 'center'
                            }}>
                                {visit.date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OfficerDashboard;