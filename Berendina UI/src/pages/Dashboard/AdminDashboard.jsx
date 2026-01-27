import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);

  // Mock Data (Updated for smoother graphs)
  const projectData = [
    { name: 'Jan', progress: 65 }, { name: 'Feb', progress: 72 },
    { name: 'Mar', progress: 68 }, { name: 'Apr', progress: 85 },
    { name: 'May', progress: 78 }, { name: 'Jun', progress: 92 }
  ];

  const beneficiaryData = [
    { name: 'Jan', beneficiaries: 120 }, { name: 'Feb', beneficiaries: 145 },
    { name: 'Mar', beneficiaries: 168 }, { name: 'Apr', beneficiaries: 210 },
    { name: 'May', beneficiaries: 230 }, { name: 'Jun', beneficiaries: 248 }
  ];

  // 1. Pending Users Fetching
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/pending-users');
      setPendingUsers(response.data);
    } catch (error) {
      console.error("Error fetching pending users", error);
    }
  };

  // 2. Approve Logic
  const handleApprove = async (userId) => {
    try {
      await axios.put('http://localhost:5000/api/auth/approve', { userId });
      alert("User Approved Successfully!");
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      alert("Approval Failed");
    }
  };

  return (
    <div className="dashboard-content">
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </div>
        <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid - 4 Cards */}
      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <h3>Pending Requests</h3>
            <div className="stat-value">{pendingUsers.length}</div>
            <span className="stat-meta">Awaiting Action</span>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Beneficiaries</h3>
            <div className="stat-value">1,248</div>
            <span className="stat-meta success">↑ 12% Month Over Month</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">🚀</div>
          <div className="stat-info">
            <h3>Active Projects</h3>
            <div className="stat-value">24</div>
            <span className="stat-meta">Ongoing Operations</span>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Resources Value</h3>
            <div className="stat-value">Rs.45k</div>
            <span className="stat-meta">Distributed YTD</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts (Left) & Pending List (Right) */}
      <div className="main-grid">
        
        {/* Left Column - Charts */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
                <h3>Project Completion Rate</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={projectData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#718096'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#718096'}} />
                <Tooltip 
                    cursor={{fill: '#f7fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="progress" fill="#4299e1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-header">
                <h3>Beneficiary Onboarding Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={beneficiaryData}>
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
                                    Approve Access
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;