import React, { useState, useEffect, useCallback } from 'react';
import './FieldVisits.css';

const FieldVisits = () => {
  const [visits, setVisits] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  
  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayVisits, setSelectedDayVisits] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  
  // Record Results State
  const [visitResult, setVisitResult] = useState({ notes: '', feedback: '', status: 'completed' });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Schedule Visit State
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
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }, []);

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
      }
    } catch (error) {
      console.error('Network error:', error);
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
      console.error('Error fetching officers:', error);
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
      console.error('Error fetching projects:', error);
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
      console.error('Error fetching beneficiaries for project:', error);
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
    setScheduleData({
      ...scheduleData,
      officerId: selectedOfficerId || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00'
    });
    setIsScheduleModalOpen(true);
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
      console.error('Schedule error:', error);
      alert('Error connecting to the server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRecordModal = (visit) => {
    setSelectedVisit(visit);
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
    setIsSaving(true);
    const formData = new FormData();
    formData.append('notes', visitResult.notes);
    formData.append('feedback', visitResult.feedback);
    formData.append('status', visitResult.status);
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
       console.error('Save result error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  // Calendar Helpers
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
    
    // Use normalization for filtering
    const dayVisits = (visits || []).filter(v => getNormalizedDate(v.date) === dateStr);
    setSelectedDayVisits(dayVisits);
    setSelectedDayLabel(`${monthNames[viewDate.getMonth()]} ${day}, ${year}`);
    setIsDayDetailsModalOpen(true);
  };

  return (
    <div className="field-visits-page-content">
      <div className="page-header">
        <div>
          <h1>Field Visits</h1>
          <p>{currentUser?.role === 'admin' ? 'Manage and assign visits for field officers' : 'Your assigned field visits'}</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button className="add-project-btn" onClick={handleOpenScheduleModal} disabled={!selectedOfficerId}>
             + Schedule Visit
          </button>
        )}
      </div>

      <div className="calendar-container">
        {currentUser?.role === 'admin' && (
          <div className="content-card officer-sidebar">
            <h3>Select Officer</h3>
            <div className="officer-selector">
              <div 
                className={`officer-item ${!selectedOfficerId ? 'active' : ''}`}
                onClick={() => handleOfficerSelect(null)}
              >
                <div className="officer-avatar">All</div>
                <strong>All Field Officers</strong>
              </div>
              {(officers || []).map(off => (
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
              ))}
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
                const hasVisit = (visits || []).some(v => getNormalizedDate(v.date) === dateStr);
                
                return (
                  <div 
                    key={day} 
                    className={`calendar-day ${hasVisit ? 'has-visit' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </div>
                );
              })}
           </div>
        </div>

        <div className="content-card timeline-section" style={{maxHeight: '70vh', overflowY: 'auto'}}>
          <h3>{selectedOfficerId ? 'Officer Timeline' : 'Recent Visits'}</h3>
          <div className="timeline-items">
            {loading ? <p>Loading...</p> : (visits || []).map(v => (
              <div key={v.id} className="timeline-item">
                <div className="timeline-date">{new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="timeline-line"><div className="timeline-dot"></div></div>
                <div className="timeline-details">
                   <div className="visit-beneficiary-name">{v.beneficiary}</div>
                   <div className="visit-location">📍 {v.address || v.district}</div>
                   <div className="visit-time">🕒 {v.time}</div>
                   
                   {v.photos && v.photos.length > 0 && (
                     <div className="visit-gallery" style={{display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '10px 0'}}>
                       {v.photos.map((p, idx) => (
                         <img 
                           key={idx} 
                           src={getFileUrl(p)} 
                           alt="Visit" 
                           style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb'}} 
                         />
                       ))}
                     </div>
                   )}

                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                     <span className={`visit-status ${v.status}`}>{v.status}</span>
                     <button 
                       className="action-btn-view" 
                       onClick={() => handleOpenRecordModal(v)}
                     >
                       {(v.status === 'scheduled' && currentUser?.role === 'officer') ? 'Record Results' : 'View Details'}
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SCHEDULE MODAL (ADMIN) */}
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

      {/* RECORD MODAL (COMMON) */}
      {isRecordModalOpen && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',  backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001}}>
          <div className="modal-content" style={{background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px'}}>
            <h2>{currentUser?.role === 'officer' ? 'Record' : 'View'} Visit: {selectedVisit.beneficiary}</h2>
            <form onSubmit={handleSubmitResult}>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Notes</label>
                <textarea 
                  className="modern-input" 
                  rows="3" 
                  value={visitResult.notes} 
                  onChange={e => setVisitResult({...visitResult, notes: e.target.value})} 
                  disabled={currentUser?.role !== 'officer'}
                />
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Status</label>
                <select 
                  className="modern-select" 
                  value={visitResult.status} 
                  onChange={e => setVisitResult({...visitResult, status: e.target.value})}
                  disabled={currentUser?.role !== 'officer'}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {currentUser?.role === 'officer' && (
                <div className="form-group" style={{marginBottom: '15px'}}>
                  <label>Upload Photos</label>
                  <input type="file" multiple className="modern-input" onChange={handlePhotoChange} />
                </div>
              )}

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="cancel-btn">{currentUser?.role === 'officer' ? 'Cancel' : 'Close'}</button>
                {currentUser?.role === 'officer' && (
                  <button type="submit" disabled={isSaving} className="save-btn">
                    {isSaving ? 'Saving...' : 'Save Results'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAY DETAILS MODAL */}
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