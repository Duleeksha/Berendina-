import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalBeneficiaries: 0, 
    activeProjects: 0, 
    totalResources: 0, 
    pendingRequests: 0,
    onboardingTrend: [],
    projectDistribution: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/pending-users'),
        axios.get('http://localhost:5000/api/analytics/dashboard-stats')
      ]);
      setPendingUsers(pendingRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Dashboard fetching error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put('http://localhost:5000/api/auth/approve', { userId });
      alert("User Approved Successfully!");
      fetchData(); 
    } catch (error) {
      console.error("Approval error:", error);
      alert("Approval Failed");
    }
  };

  return (
    <div className="dashboard-content">
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's what's happening across your programs.</p>
        </div>
        <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '50px'}}>Loading dashboard data...</div>
      ) : (
        <>
        {/* Stats Grid - 4 Cards */}
        <div className="stats-grid">
          {/* Card 1: Pending */}
          <div className="stat-card orange">
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <h3>Pending Requests</h3>
              <div className="stat-value">{stats.pendingRequests}</div>
              <span className="stat-meta">Active queue</span>
            </div>
          </div>

          {/* Card 2: Beneficiaries */}
          <div className="stat-card blue">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Beneficiaries</h3>
              <div className="stat-value">{stats.totalBeneficiaries.toLocaleString()}</div>
              <span className="stat-meta success">Registered total</span>
            </div>
          </div>

          {/* Card 3: Projects */}
          <div className="stat-card green">
            <div className="stat-icon">🚀</div>
            <div className="stat-info">
              <h3>Active Projects</h3>
              <div className="stat-value">{stats.activeProjects}</div>
              <span className="stat-meta">Live operations</span>
            </div>
          </div>

          {/* Card 4: Resources */}
          <div className="stat-card purple">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>Resource Items</h3>
              <div className="stat-value">{stats.totalResources.toLocaleString()}</div>
              <span className="stat-meta">In inventory</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Charts & Pending List */}
        <div className="main-grid">
          
          {/* Left Column - Charts */}
          <div className="charts-section">
            <div className="chart-card">
              <div className="chart-header">
                  <h3>Beneficiaries per Project</h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                {stats.projectDistribution.length > 0 ? (
                  <BarChart data={stats.projectDistribution} barSize={50}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#718096'}} />
                    <Tooltip 
                        cursor={{fill: '#f7fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="beneficiaries" fill="#4299e1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'}}>No project data yet</div>}
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                  <h3>Onboarding Trend (Last 6 Months)</h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                {stats.onboardingTrend.length > 0 ? (
                  <AreaChart data={stats.onboardingTrend}>
                    <defs>
                      <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#48bb78" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#48bb78" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#718096'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#718096'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="beneficiaries" stroke="#48bb78" strokeWidth={3} fillOpacity={1} fill="url(#colorBen)" />
                  </AreaChart>
                ) : <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'}}>No onboarding data yet</div>}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column - Pending Approvals List */}
          <div className="side-panel">
              <div className="panel-card">
                  <div className="panel-header">
                      <h3>Pending Approvals</h3>
                      <span className="badge">{pendingUsers.length} New</span>
                  </div>
                  
                  <div className="approval-list">
                      {pendingUsers.length === 0 ? (
                          <div style={{textAlign: 'center', padding: '40px 0', color: '#a0aec0'}}>
                              <p>All caught up! 🎉</p>
                              <small>No pending requests.</small>
                          </div>
                      ) : (
                          pendingUsers.map(user => (
                              <div key={user.user_id} className="approval-item">
                                  <div className="user-details-row">
                                      <div className="avatar-placeholder">
                                          {user.first_name.charAt(0)}
                                      </div>
                                      <div className="user-text">
                                          <h4>{user.first_name} {user.last_name}</h4>
                                          <p>{user.email}</p>
                                          <span className="role-badge">{user.role}</span>
                                      </div>
                                  </div>
                                  <button 
                                      className="approve-btn"
                                      onClick={() => handleApprove(user.user_id)}
                                  >
                                      Approve
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;