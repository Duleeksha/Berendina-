import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import { PROJECT_MILESTONES, getMilestoneFromValue } from '../../utils/progressConstants';
// Main screen for field officers to see their work
const OfficerDashboard = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newVisitCount, setNewVisitCount] = useState(0);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localResourceConditions, setLocalResourceConditions] = useState({});
  const [visitFeedback, setVisitFeedback] = useState('');
  const [selectedPhase, setSelectedPhase] = useState(null);
  // Get the officer info from session
  const currentUser = (() => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  })();
  // Ask server for list of visits assigned to me
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
      console.error("Error fetching dashboard visits:", error);
      alert('Error fetching dashboard visits.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);
  // Bring info from server when screen first open
  useEffect(() => {
    if (currentUser?.id) {
      fetchVisits();
    }
  }, [currentUser?.id, fetchVisits]);
  // Tell server I have seen the new visit alert
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
       console.error("Error dismissing notifications:", error);
       alert("Error: System failed to dismiss the notification.");
    }
  };
  // Show full details when a visit is clicked
  const handleVisitClick = (visit) => {
    setSelectedVisit(visit);
    setVisitFeedback(visit.feedback || '');
    const currentMilestone = getMilestoneFromValue(visit.beneficiary_progress || 0);
    setSelectedPhase(currentMilestone);
    const initialConditions = {};
    if (visit.allocated_resources) {
        visit.allocated_resources.forEach(res => {
            initialConditions[res.id] = { condition: res.condition || 'Functional', name: res.name };
        });
    }
    setLocalResourceConditions(initialConditions);
    setIsModalOpen(true);
  };
  const handleBannerClick = () => {
    const newVisits = visits.filter(v => v.is_new);
    if (newVisits.length > 0) {
      handleVisitClick(newVisits[0]);
    }
  };
  // Tell server visit is finished and save findings
  const handleCompleteVisit = async (visitId) => {
    const resourceUpdates = Object.entries(localResourceConditions).map(([id, data]) => ({
        id: parseInt(id),
        name: data.name,
        condition: data.condition
    }));
    try {
      const formData = new FormData();
      formData.append('notes', selectedVisit.notes || '');
      formData.append('feedback', visitFeedback);
      formData.append('status', 'completed');
      formData.append('resourceUpdates', JSON.stringify(resourceUpdates));
      if (selectedPhase) {
        formData.append('beneficiaryProgress', selectedPhase.value);
        formData.append('beneficiaryPhase', selectedPhase.label);
      }
      const response = await fetch(`http://localhost:5000/api/visits/${visitId}`, {
        method: 'PUT',
        body: formData
      });
      if (response.ok) {
        alert('Visit finalized successfully!');
        setIsModalOpen(false);
        fetchVisits();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to update visit: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error("Visit Update Error:", error);
      alert("Error: Could not connect to the server to finalize the visit.");
    }
  };
  const upcomingVisits = visits.filter(v => v.status === 'scheduled').slice(0, 5);
  const completedVisits = visits.filter(v => v.status === 'completed');
  const myVisitsData = [
    { name: 'Mon', visits: 2 }, { name: 'Tue', visits: 4 },
    { name: 'Wed', visits: 1 }, { name: 'Thu', visits: 5 },
    { name: 'Fri', visits: 3 }
  ];
  // This is the dashboard layout on the screen
  return (
    <div className="dashboard-content">
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
              You have {newVisitCount} new assignment{newVisitCount > 1 ? 's' : ''}. 
              Next: <b>{visits.find(v => v.is_new)?.beneficiary}</b> 
              ({visits.find(v => v.is_new)?.allocated_resources?.length || 0} resources to audit).
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
      <div className="dashboard-header">
        <div>
          <h1>Officer Dashboard</h1>
          <p>Welcome back, {currentUser?.firstName || 'Officer'}! Here is your field summary.</p>
        </div>
        <div className="date-display">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
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
        <div className="side-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="content-card upcoming-section" style={{ display: 'flex', flexDirection: 'column', maxHeight: '45vh', border: '1px solid #111827' }}>
                <div className="panel-header">
                    <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#111827', fontWeight: 800 }}>📅 Upcoming Visits</h3>
                </div>
                <div className="timeline-items" style={{ overflowY: 'auto', paddingRight: '5px' }}>
                    {loading ? <p>Loading visits...</p> : (
                      upcomingVisits.length > 0 ? upcomingVisits.map(visit => (
                        <div key={visit.id} className="timeline-item" onClick={() => handleVisitClick(visit)} style={{cursor: 'pointer'}}>
                            <div className="timeline-date" style={{ color: '#111827', fontWeight: 700 }}>{new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div className="timeline-line"><div className="timeline-dot" style={{ background: '#111827' }}></div></div>
                            <div className="timeline-details" style={{ padding: '10px', background: 'white', border: '1px solid #e5e7eb' }}>
                                <div className="visit-beneficiary-name" style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>{visit.beneficiary}</div>
                                <div className="visit-location" style={{ fontSize: '11px', color: '#6b7280' }}>📍 {visit.address || visit.district}</div>
                            </div>
                        </div>
                      )) : <p className="empty-state-text" style={{ fontSize: '13px', textAlign: 'center' }}>No upcoming visits.</p>
                    )}
                </div>
            </div>
            <div className="content-card history-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxHeight: '40vh', background: '#fcfcfc' }}>
                <div className="panel-header">
                    <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#6b7280' }}>📊 Visit History</h3>
                </div>
                <div className="timeline-items" style={{ overflowY: 'auto', paddingRight: '5px' }}>
                    {loading ? <p>Loading...</p> : (
                      completedVisits.length > 0 ? completedVisits.map(visit => (
                        <div key={visit.id} className="timeline-item" style={{ opacity: 0.8, cursor: 'pointer' }} onClick={() => handleVisitClick(visit)}>
                            <div className="timeline-date">{new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div className="timeline-line"><div className="timeline-dot" style={{ background: '#94a3b8' }}></div></div>
                            <div className="timeline-details" style={{ padding: '10px' }}>
                                <div className="visit-beneficiary-name" style={{ fontSize: '13px' }}>{visit.beneficiary}</div>
                            </div>
                        </div>
                      )) : <p className="empty-state-text" style={{ fontSize: '13px', textAlign: 'center' }}>No completed visits yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
      {isModalOpen && selectedVisit && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '35px', borderRadius: '20px', 
            width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative', animation: 'modalSlideUp 0.3s ease-out'
          }}>
            <button onClick={() => setIsModalOpen(false)} style={{
                position: 'absolute', top: '20px', right: '20px', border: 'none', 
                background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280', fontWeight: 'bold'
              }}>✕</button>
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
              <div style={{color: '#0c4a6e', fontSize: '18px', fontWeight: 700}}>{selectedVisit.project_name || 'No Project Assigned'}</div>
            </div>
            <div style={{marginBottom: '25px'}}>
              <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>📋 Resource Audit (Verify Condition)</label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {selectedVisit.allocated_resources && selectedVisit.allocated_resources.length > 0 ? (
                  selectedVisit.allocated_resources.map((res, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0'
                    }}>
                        <div style={{fontWeight: 600, color: '#334155', fontSize: '14px'}}>📦 {res.name}</div>
                        <div style={{display: 'flex', gap: '5px'}}>
                            {['Functional', 'Repair', 'Damaged'].map(status => (
                                <button key={status} onClick={() => setLocalResourceConditions(prev => ({ ...prev, [res.id]: { ...prev[res.id], condition: status } }))}
                                    style={{
                                        fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                        background: localResourceConditions[res.id]?.condition === status ? (status === 'Functional' ? '#10b981' : (status === 'Repair' ? '#f59e0b' : '#ef4444')) : '#e2e8f0',
                                        color: localResourceConditions[res.id]?.condition === status ? 'white' : '#64748b',
                                        fontWeight: 600, transition: 'all 0.2s'
                                    }}>{status}</button>
                            ))}
                        </div>
                    </div>
                  ))
                ) : (
                  <div style={{color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', background: '#f9fafb', padding: '15px', borderRadius: '12px', textAlign: 'center'}}>No resources allocated to this beneficiary.</div>
                )}
              </div>
            </div>
            <div style={{marginBottom: '25px'}}>
                <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase'}}>Visit Feedback & Notes</label>
                <textarea value={visitFeedback} onChange={(e) => setVisitFeedback(e.target.value)} placeholder="Enter visit observations..."
                    style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#1e293b', resize: 'none', display: 'block', outline: 'none' }} />
            </div>
            <div style={{marginBottom: '25px'}}>
              <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>📈 Update Beneficiary Phase</label>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px'}}>
                {PROJECT_MILESTONES.map(m => (
                  <button key={m.label} onClick={() => setSelectedPhase(m)}
                    style={{
                      padding: '8px 4px', borderRadius: '8px', border: '2px solid',
                      borderColor: selectedPhase?.value === m.value ? '#10b981' : '#f1f5f9',
                      background: selectedPhase?.value === m.value ? '#ecfdf5' : '#f8fafc',
                      color: selectedPhase?.value === m.value ? '#047857' : '#64748b',
                      fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                    }}>
                    <span>
                      {m.value === 5 && '📝'}
                      {m.value === 25 && '📚'}
                      {m.value === 50 && '📦'}
                      {m.value === 80 && '🔍'}
                      {m.value === 100 && '🎓'}
                    </span>
                    {m.label.split('. ')[1]}
                  </button>
                ))}
              </div>
              {selectedPhase && (
                <div style={{marginTop: '10px', fontSize: '11px', color: '#059669', textAlign: 'center', fontWeight: 600}}>Selected: {selectedPhase.label} ({selectedPhase.value}%)</div>
              )}
            </div>
            <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase'}}>Visit Date</label>
                <div style={{color: '#4b5563', fontWeight: 500}}>{selectedVisit.date}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <label style={{display: 'block', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase'}}>Visit Time</label>
                <div style={{color: '#4b5563', fontWeight: 500}}>{selectedVisit.time}</div>
              </div>
            </div>
            <div style={{display: 'flex', gap: '15px'}}>
              <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#4b5563', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              {selectedVisit.status !== 'completed' && (
                <button onClick={() => handleCompleteVisit(selectedVisit.id)} style={{ flex: 2, padding: '12px', background: '#10b981', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>Mark as Completed</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OfficerDashboard;