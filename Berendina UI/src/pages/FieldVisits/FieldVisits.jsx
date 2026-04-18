import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './FieldVisits.css';
import { PROJECT_MILESTONES, getMilestoneFromValue } from '../../utils/progressConstants';
const FieldVisits = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayVisits, setSelectedDayVisits] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  const [visitResult, setVisitResult] = useState({ notes: '', feedback: '', status: 'completed' });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [localResourceConditions, setLocalResourceConditions] = useState({});
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [projects, setProjects] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    projectId: '',
    beneficiaryName: '',
    address: '',
    district: '',
    date: '',
    time: '10:00',
    officerId: '',
    beneficiaryId: ''
  });
  const currentUser = React.useMemo(() => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }, []);
  const filteredOfficers = React.useMemo(() => {
    return (officers || []).filter(off => {
      const isOffAvailable = off.isAvailable !== false;
      const fullName = `${off.firstName || ''} ${off.lastName || ''}`.toLowerCase();
      return isOffAvailable && fullName.includes(searchTerm.toLowerCase());
    });
  }, [officers, searchTerm]);
  const fetchVisits = useCallback(async (officerId) => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/visits';
      const targetId = officerId || (currentUser?.role === 'officer' ? currentUser.id : null);
      if (targetId) url += `?officerId=${targetId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      } else {
        alert("System Message: Unable to load scheduled visits. Please try again.");
      }
    } catch (error) {
      alert("Network Connection Error: Could not reach the server for visits.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.role]);
  const fetchOfficers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/officers');
      if (response.ok) {
        const data = await response.json();
        setOfficers(data);
      }
    } catch (error) {
    }
  };
  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchOfficers();
      fetchProjects();
      fetchVisits();
    } else {
      fetchVisits();
    }
  }, [currentUser?.role, fetchVisits]);
  const handleOfficerSelect = (id) => {
    setSelectedOfficerId(id);
    fetchVisits(id);
  };
  const handleProjectChange = async (projectName) => {
    setScheduleData(prev => ({ 
      ...prev, 
      projectId: projectName, 
      beneficiaryName: '', 
      address: '', 
      district: '' 
    }));
    try {
      const response = await fetch(`http://localhost:5000/api/beneficiaries?project=${encodeURIComponent(projectName)}`);
      if (response.ok) {
        const data = await response.json();
        setBeneficiaries(data);
      }
    } catch (error) {
       alert("Error: Could not retrieve beneficiaries for the selected project.");
    }
  };
  const handleBeneficiaryChange = (id) => {
    const ben = beneficiaries.find(b => b.id === parseInt(id));
    if (ben) {
      setScheduleData({ 
        ...scheduleData, 
        beneficiaryName: ben.name, 
        beneficiaryId: ben.id,
        address: ben.address || 'No address provided',
        district: ben.district || 'N/A'
      });
    }
  };
  const handleOpenScheduleModal = () => {
    navigate('/field-officers', { 
      state: { message: "Please check the availability of the field visitors and schedule" } 
    });
  };
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary: scheduleData.beneficiaryName,
          beneficiaryId: scheduleData.beneficiaryId,
          district: scheduleData.district,
          address: scheduleData.address,
          date: scheduleData.date,
          time: scheduleData.time,
          officerId: scheduleData.officerId,
          status: 'scheduled'
        })
      });
      if (response.ok) {
        alert('Visit scheduled successfully!');
        setIsScheduleModalOpen(false);
        fetchVisits(selectedOfficerId);
      } else {
        const errorData = await response.json();
        alert(`Schedule failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error: Unable to connect to the scheduling service. Check your connection.');
    } finally {
      setIsSaving(false);
    }
  };
  const handleOpenRecordModal = (visit) => {
    setSelectedVisit(visit);
    const initialConditions = {};
    if (visit.allocated_resources) {
        visit.allocated_resources.forEach(res => {
            initialConditions[res.id] = { condition: res.condition || 'Functional', name: res.name };
        });
    }
    setLocalResourceConditions(initialConditions);
    const currentMilestone = getMilestoneFromValue(visit.beneficiary_progress || 0);
    setSelectedPhase(currentMilestone);
    setVisitResult({
      notes: visit.notes || '',
      feedback: visit.feedback || '',
      status: visit.status || 'completed'
    });
    setIsRecordModalOpen(true);
  };
  const handlePhotoChange = (e) => {
    setSelectedPhotos(Array.from(e.target.files));
  };
  const handleSubmitResult = async (e) => {
    e.preventDefault();
    const resourceUpdates = Object.entries(localResourceConditions).map(([id, data]) => ({
        id: parseInt(id),
        name: data.name,
        condition: data.condition
    }));
    setIsSaving(true);
    const formData = new FormData();
    formData.append('notes', visitResult.notes);
    formData.append('feedback', visitResult.feedback);
    formData.append('status', visitResult.status);
    formData.append('resourceUpdates', JSON.stringify(resourceUpdates));
    if (selectedPhase) {
      formData.append('beneficiaryProgress', selectedPhase.value);
      formData.append('beneficiaryPhase', selectedPhase.label);
    }
    selectedPhotos.forEach(p => formData.append('photos', p));
    try {
      const response = await fetch(`http://localhost:5000/api/visits/${selectedVisit.id}`, {
        method: 'PUT',
        body: formData
      });
      if (response.ok) {
        alert('Visit finalized!');
        setIsRecordModalOpen(false);
        fetchVisits(selectedOfficerId);
      }
    } catch (error) {
       alert("Error: Failed to finalize the visit results on the server.");
    } finally {
      setIsSaving(false);
    }
  };
  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };
  const getNormalizedDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    const yr = dateObj.getFullYear();
    const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
    const da = String(dateObj.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const handleDayClick = (day) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayVisits = (visits || []).filter(v => getNormalizedDate(v.date) === dateStr);
    setSelectedDayVisits(dayVisits);
    setSelectedDayLabel(`${monthNames[viewDate.getMonth()]} ${day}, ${year}`);
    setIsDayDetailsModalOpen(true);
  };
  const activeVisits = (visits || []).filter(v => v.status === 'scheduled' || v.status === 'pending');
  const completedHistory = (visits || []).filter(v => v.status === 'completed' || v.status === 'cancelled');
  return (
    <div className="field-visits-page-content">
      <div className="page-header">
        <div>
          <h1>Field Visits</h1>
          <p>{currentUser?.role === 'admin' ? 'Manage and assign visits for field officers' : 'Your assigned field visits'}</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button className="add-project-btn" onClick={handleOpenScheduleModal}>
             + Schedule Visit
          </button>
        )}
      </div>
      <div className="calendar-container">
        {currentUser?.role === 'admin' && (
          <div className="content-card officer-sidebar">
            <div className="sidebar-header">
              <h3>Select Officer</h3>
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search Field Officer..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="officer-selector">
              <div 
                className={`officer-item ${!selectedOfficerId ? 'active' : ''}`}
                onClick={() => handleOfficerSelect(null)}
              >
                <div className="officer-avatar">All</div>
                <strong>All Field Officers</strong>
              </div>
              {filteredOfficers.length > 0 ? (
                filteredOfficers.map(off => (
                  <div 
                    key={off.id} 
                    className={`officer-item ${selectedOfficerId === off.id ? 'active' : ''}`}
                    onClick={() => handleOfficerSelect(off.id)}
                  >
                    <div className="officer-avatar">{off?.firstName?.[0] || '?'}</div>
                    <div>
                      <strong>{off?.firstName || ''} {off?.lastName || ''}</strong>
                      <div style={{fontSize: '0.75rem', opacity: 0.8}}>{off?.district || ''}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results-msg">
                  No Field Officer found
                </div>
              )}
            </div>
          </div>
        )}
        <div className="content-card calendar-section">
           <div className="calendar-header-nav">
              <button className="nav-btn" onClick={handlePrevMonth}>&lt;</button>
              <h3>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
              <button className="nav-btn" onClick={handleNextMonth}>&gt;</button>
           </div>
           <div className="calendar-days-header">
             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
           </div>
           <div className="calendar-grid">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="empty-day"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayVisits = (visits || []).filter(v => getNormalizedDate(v.date) === dateStr);
                const hasActiveVisit = dayVisits.some(v => v.status !== 'completed' && v.status !== 'cancelled');
                return (
                  <div 
                    key={day} 
                    className={`calendar-day ${hasActiveVisit ? 'has-visit' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </div>
                );
              })}
           </div>
           <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot has-visit"></div>
                <span>Active Assignments</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot"></div>
                <span>Completed visits (Not highlighted)</span>
              </div>
            </div>
        </div>
        <div className="side-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="content-card upcoming-section" style={{ display: 'flex', flexDirection: 'column', maxHeight: '45vh', border: '1px solid #111827' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#111827', fontWeight: 800 }}>📅 Upcoming Visits</h3>
            <div className="timeline-items" style={{ overflowY: 'auto', paddingRight: '5px' }}>
              {loading ? <p>Loading...</p> : activeVisits.length > 0 ? activeVisits.map(v => (
                <div key={v.id} className="timeline-item">
                  <div className="timeline-date" style={{ color: '#111827', fontWeight: 700 }}>{new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="timeline-line"><div className="timeline-dot" style={{ background: '#111827' }}></div></div>
                  <div className="timeline-details" style={{ padding: '10px', background: 'white', border: '1px solid #e5e7eb' }}>
                    <div className="visit-beneficiary-name" style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>{v.beneficiary}</div>
                    <div className="visit-location" style={{ fontSize: '11px' }}>📍 {v.address || v.district}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span className={`visit-status ${v.status}`} style={{ fontSize: '10px' }}>{v.status}</span>
                      <button className="action-btn-view" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleOpenRecordModal(v)}>
                        {currentUser?.role === 'officer' ? 'Record' : 'View'}
                      </button>
                    </div>
                  </div>
                </div>
              )) : <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>No upcoming visits.</p>}
            </div>
          </div>
          <div className="content-card history-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxHeight: '40vh', background: '#fcfcfc', border: '1px solid #111827' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#111827', fontWeight: 800 }}>📂 Visit History</h3>
            <div className="timeline-items" style={{ overflowY: 'auto', paddingRight: '5px' }}>
              {loading ? <p>Loading...</p> : completedHistory.length > 0 ? completedHistory.map(v => (
                <div key={v.id} className="timeline-item" style={{ opacity: 1 }}>
                  <div className="timeline-date" style={{ color: '#111827' }}>{new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="timeline-line"><div className="timeline-dot" style={{ background: '#111827' }}></div></div>
                  <div className="timeline-details" style={{ padding: '10px', background: 'white', border: '1px solid #e5e7eb' }}>
                    <div className="visit-beneficiary-name" style={{ fontSize: '13px', color: '#111827' }}>{v.beneficiary}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span className={`visit-status ${v.status}`} style={{ fontSize: '10px' }}>{v.status}</span>
                      <button className="action-btn-view" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleOpenRecordModal(v)}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )) : <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>No history yet.</p>}
            </div>
          </div>
        </div>
      </div>
      {}
      {isScheduleModalOpen && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',  backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001}}>
          <div className="modal-content" style={{background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px'}}>
            <h2>Schedule New Visit</h2>
            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Target Project</label>
                <select className="modern-select" value={scheduleData.projectId} onChange={(e) => handleProjectChange(e.target.value)} required>
                  <option value="">Select Project</option>
                  {(projects || []).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Beneficiary</label>
                <select 
                  className="modern-select" 
                  value={beneficiaries.find(b => b.name === scheduleData.beneficiaryName)?.id || ""} 
                  onChange={(e) => handleBeneficiaryChange(e.target.value)} 
                  required 
                  disabled={!scheduleData.projectId}
                >
                  <option value="">Select Beneficiary</option>
                  {(beneficiaries || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Visit Location (Auto-set)</label>
                <div className="address-preview">
                   {scheduleData.address ? (
                     <>
                       <strong>{scheduleData.address}</strong>
                       <div style={{fontSize: '0.85rem', opacity: 0.7}}>District: {scheduleData.district}</div>
                     </>
                   ) : 'Select beneficiary first'}
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="modern-input" value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input type="time" className="modern-input" value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} required />
                </div>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="cancel-btn">Cancel</button>
                <button type="submit" disabled={isSaving} className="save-btn">Create Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {}
      {isRecordModalOpen && selectedVisit && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '35px', borderRadius: '20px', 
            width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsRecordModalOpen(false)}
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
              <h2 style={{margin: 0, color: '#111827', fontSize: '24px'}}>{currentUser?.role === 'officer' ? 'Record Visit' : 'Visit Details'}</h2>
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
              <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                📋 Resource Audit (Verify Condition)
              </label>
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
                                <button
                                    key={status}
                                    type="button"
                                    disabled={currentUser?.role !== 'officer' || selectedVisit.status === 'completed'}
                                    onClick={() => setLocalResourceConditions(prev => ({
                                        ...prev, [res.id]: { ...prev[res.id], condition: status }
                                    }))}
                                    style={{
                                        fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                        background: localResourceConditions[res.id]?.condition === status 
                                            ? (status === 'Functional' ? '#10b981' : (status === 'Repair' ? '#f59e0b' : '#ef4444'))
                                            : '#e2e8f0',
                                        color: localResourceConditions[res.id]?.condition === status ? 'white' : '#64748b',
                                        fontWeight: 600, transition: 'all 0.2s',
                                        opacity: (currentUser?.role !== 'officer' || selectedVisit.status === 'completed') && localResourceConditions[res.id]?.condition !== status ? 0.4 : 1
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                  ))
                ) : (
                  <div style={{color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', background: '#f9fafb', padding: '15px', borderRadius: '12px', textAlign: 'center'}}>
                    No resources allocated to this beneficiary.
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmitResult}>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase'}}>Visit Feedback & Notes</label>
                <textarea 
                  className="modern-input" 
                  rows="3" 
                  value={visitResult.feedback} 
                  onChange={e => setVisitResult({...visitResult, feedback: e.target.value})} 
                  placeholder="Enter visit observations..."
                  disabled={currentUser?.role !== 'officer' || selectedVisit.status === 'completed'}
                  style={{borderRadius: '12px', resize: 'none'}}
                />
              </div>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '10px', fontWeight: 600}}>PROJECT PROGRESS PHASE</label>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px'}}>
                    {PROJECT_MILESTONES.map(m => (
                        <button
                            key={m.label}
                            type="button"
                            onClick={() => setSelectedPhase(m)}
                            style={{
                                padding: '8px 4px',
                                borderRadius: '8px',
                                border: '2px solid',
                                borderColor: selectedPhase?.value === m.value ? '#10b981' : '#e2e8f0',
                                background: selectedPhase?.value === m.value ? '#ecfdf5' : 'white',
                                color: selectedPhase?.value === m.value ? '#047857' : '#64748b',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center', gap: '2px'
                            }}
                        >
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
                    <div style={{marginTop: '8px', fontSize: '11px', color: '#059669', textAlign: 'center', fontWeight: 'bold'}}>
                        Updating to: {selectedPhase.label} ({selectedPhase.value}%)
                    </div>
                )}
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                <div className="form-group">
                  <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase'}}>Status</label>
                  <select 
                    className="modern-select" 
                    value={visitResult.status} 
                    onChange={e => setVisitResult({...visitResult, status: e.target.value})}
                    disabled={currentUser?.role !== 'officer' || selectedVisit.status === 'completed'}
                    style={{borderRadius: '10px'}}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {currentUser?.role === 'officer' && selectedVisit.status !== 'completed' && (
                  <div className="form-group">
                    <label style={{display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase'}}>Upload Photos</label>
                    <input type="file" multiple className="modern-input" onChange={handlePhotoChange} style={{fontSize: '11px'}} />
                  </div>
                )}
              </div>
              <div style={{display: 'flex', gap: '15px', marginTop: '25px'}}>
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="cancel-btn" style={{flex: 1, borderRadius: '12px'}}>{currentUser?.role === 'officer' && selectedVisit.status !== 'completed' ? 'Cancel' : 'Close'}</button>
                {currentUser?.role === 'officer' && selectedVisit.status !== 'completed' && (
                  <button type="submit" disabled={isSaving} className="save-btn" style={{flex: 2, borderRadius: '12px'}}>
                    {isSaving ? 'Saving...' : 'Finalize Visit'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {}
      {isDayDetailsModalOpen && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',  backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001}}>
          <div className="modal-content" style={{background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px'}}>
            <h2>Visits for {selectedDayLabel}</h2>
            <div className="day-visits-list" style={{margin: '20px 0'}}>
              {selectedDayVisits.length > 0 ? (
                selectedDayVisits.map(v => (
                  <div key={v.id} style={{padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e5e7eb'}}>
                    <div style={{fontWeight: '700', color: '#111827'}}>{v.beneficiary}</div>
                    <div style={{fontSize: '0.85rem', color: '#6b7280'}}>{v.time} - {v.address}</div>
                    <div className={`visit-status ${v.status}`} style={{marginTop: '5px', fontSize: '0.75rem'}}>{v.status}</div>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                  No scheduled visits for this day.
                </div>
              )}
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button onClick={() => setIsDayDetailsModalOpen(false)} className="save-btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FieldVisits;