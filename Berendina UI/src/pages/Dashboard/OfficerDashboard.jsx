import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css'; // Existing styles

const OfficerDashboard = () => {
  // Officer Specific Data
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
    <div className="dashboard-content sidebar-open">
      <div className="page-header">
        <h1>Officer Dashboard</h1>
        <p>Welcome back! Here is your field summary.</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">My Beneficiaries</div>
          <div className="card-value">45</div>
          <div className="card-meta">Assigned to you</div>
        </div>
        <div className="summary-card">
          <div className="card-header">Pending Visits</div>
          <div className="card-value">8</div>
          <div className="card-meta">This week</div>
        </div>
        <div className="summary-card">
          <div className="card-header">Resources Distributed</div>
          <div className="card-value">12</div>
          <div className="card-meta">Items</div>
        </div>
      </div>

      <div className="charts-container">
        {/* Visits Chart */}
        <div className="chart-card">
          <h3>My Field Visits (This Week)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={myVisitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Upcoming List */}
        <div className="visits-card">
          <h3>📅 Upcoming Visits</h3>
          <div className="visits-list">
            {upcomingVisits.map(visit => (
              <div key={visit.id} className="visit-item">
                <div className="visit-info">
                  <div className="visit-beneficiary">{visit.beneficiary}</div>
                  <div className="visit-location">{visit.location}</div>
                </div>
                <div className="visit-date">{visit.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// CORRECTED LINE BELOW
export default OfficerDashboard;