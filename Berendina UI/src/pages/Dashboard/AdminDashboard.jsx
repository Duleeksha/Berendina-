import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // For Detailed Review
  const [stats, setStats] = useState({ 
    totalBeneficiaries: 0, 
    activeProjects: 0, 
    totalResources: 0, 
    pendingRequests: 0,
    onboardingTrend: [],
    projectDistribution: []
  });

  // Action Confirmation State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToAction, setUserToAction] = useState(null);
  const [actionType, setActionType] = useState('');

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
       // Silently fail fetching dashboard stats to avoid spamming the user, 
       // but ensure loading state is cleared.
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    if (action === 'reject' && !isConfirmModalOpen) {
      setUserToAction(userId);
      setActionType('reject');
      setIsConfirmModalOpen(true);
      return;
    }

    try {
      await axios.put('http://localhost:5000/api/auth/approve', { 
        userId: userId || userToAction, 
        action: action || actionType 
      });
      alert(`User ${ (action || actionType) === 'reject' ? 'Rejected' : 'Approved'} Successfully!`);
      setIsConfirmModalOpen(false);
      setSelectedUser(null);
      fetchData(); 
    } catch (error) {
      alert("Error: Failed to process the registration action. Please try again.");
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Governance & Oversight Panel</p>
        </div>
        <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '50px'}}>Loading dashboard data...</div>
      ) : (
        <>
        <div className="stats-grid">
          <div className="stat-card orange">
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <h3>Pending Requests</h3>
              <div className="stat-value">{pendingUsers.length}</div>
              <span className="stat-meta">Awaiting review</span>
            </div>
          </div>

          <div className="stat-card blue">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Beneficiaries</h3>
              <div className="stat-value">{stats.totalBeneficiaries.toLocaleString()}</div>
              <span className="stat-meta success">Registered total</span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">🚀</div>
            <div className="stat-info">
              <h3>Active Projects</h3>
              <div className="stat-value">{stats.activeProjects}</div>
              <span className="stat-meta">Live operations</span>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>Resource Items</h3>
              <div className="stat-value">{stats.totalResources.toLocaleString()}</div>
              <span className="stat-meta">In inventory</span>
            </div>
          </div>
        </div>

        <div className="main-grid">
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
                    <YAxis hide={true} />
                    <Tooltip 
                        cursor={{fill: '#f7fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="beneficiaries" fill="#4299e1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'}}>No project data yet</div>}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="side-panel">
              <div className="panel-card">
                  <div className="panel-header">
                      <h3>Pending Approvals</h3>
                      <span className="badge">{pendingUsers.length}</span>
                  </div>
                  
                  <div className="approval-list">
                      {pendingUsers.length === 0 ? (
                          <div style={{textAlign: 'center', padding: '40px 0', color: '#a0aec0'}}>
                              <p>All caught up! 🎉</p>
                          </div>
                      ) : (
                          pendingUsers.map(user => (
                              <div key={user.user_id} className="approval-item" onClick={() => setSelectedUser(user)} style={{cursor: 'pointer'}}>
                                  <div className="user-details-row">
                                      <div className="avatar-placeholder">{user.first_name.charAt(0)}</div>
                                      <div className="user-text">
                                          <h4>{user.first_name} {user.last_name}</h4>
                                          <p>{user.email}</p>
                                          <span className="role-badge">{user.role}</span>
                                      </div>
                                  </div>
                                  <div className="action-buttons">
                                      <button className="reject-btn" onClick={(e) => { e.stopPropagation(); handleAction(user.user_id, 'reject'); }}>Reject</button>
                                      <button className="approve-btn" onClick={(e) => { e.stopPropagation(); handleAction(user.user_id, 'approve'); }}>Approve</button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
        </div>

        {/* Detailed Review Modal */}
        {selectedUser && (
            <div className="review-modal-overlay">
                <div className="review-modal">
                    <h2>Review Registration</h2>
                    <p className="subtitle">Please verify credentials before granting access.</p>
                    
                    <div className="details-grid">
                        <div className="detail-item">
                            <label>Full Name</label>
                            <span>{selectedUser.first_name} {selectedUser.last_name}</span>
                        </div>
                        <div className="detail-item">
                            <label>Role</label>
                            <span className="role-badge">{selectedUser.role}</span>
                        </div>
                        <div className="detail-item">
                            <label>Organization</label>
                            <span>{selectedUser.organization || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Email</label>
                            <span>{selectedUser.email}</span>
                        </div>
                         {selectedUser.role === 'admin' && (
                             <>
                                 <div className="detail-item">
                                     <label>Employee ID</label>
                                     <span>{selectedUser.employee_id || 'N/A'}</span>
                                 </div>
                                 <div className="detail-item">
                                     <label>DS Division</label>
                                     <span>{selectedUser.branch || 'N/A'}</span>
                                 </div>
                                 <div className="detail-item">
                                     <label>Job Title</label>
                                     <span>{selectedUser.job_title || 'N/A'}</span>
                                 </div>
                             </>
                         )}
                         {selectedUser.role === 'officer' && (
                            <>
                                <div className="detail-item">
                                    <label>Mobile Number</label>
                                    <span>{selectedUser.mobile_no || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>DS Division</label>
                                    <span>{selectedUser.ds_division || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Vehicle Info</label>
                                    <span>{selectedUser.vehicle_type || 'None'} {selectedUser.vehicle_no ? `(${selectedUser.vehicle_no})` : ''}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Languages</label>
                                    <span>{selectedUser.languages || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Emergency Contact</label>
                                    <span>{selectedUser.emergency_contact || 'N/A'}</span>
                                </div>
                            </>
                         )}
                        <div className="detail-item">
                            <label>Gender</label>
                            <span>{selectedUser.gender || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
                        <button className="reject-btn" style={{flex: 1}} onClick={() => handleAction(selectedUser.user_id, 'reject')}>Reject</button>
                        <button className="btn-primary" onClick={() => handleAction(selectedUser.user_id, 'approve')}>Approve Access</button>
                    </div>
                </div>
            </div>
        )}
        {/* Action Confirmation Modal */}
        {isConfirmModalOpen && (
            <div className="review-modal-overlay" style={{zIndex: 2000}}>
                <div className="review-modal" style={{maxWidth: '400px', textAlign: 'center'}}>
                    <div style={{fontSize: '50px', marginBottom: '20px'}}>⚠️</div>
                    <h2>Are you sure?</h2>
                    <p className="subtitle">
                        Do you really want to reject this registration request? This user will not be able to access the system.
                    </p>
                    <div className="modal-actions" style={{marginTop: '30px'}}>
                        <button className="btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</button>
                        <button className="reject-btn" onClick={() => handleAction(userToAction, 'reject')}>Yes, Reject</button>
                    </div>
                </div>
            </div>
        )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;