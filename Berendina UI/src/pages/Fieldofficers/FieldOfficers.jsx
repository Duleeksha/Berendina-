import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './FieldOfficers.css';

const FieldOfficers = () => {
  const location = useLocation();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState(location.state?.message || null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Schedule Visit State
  const [projects, setProjects] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]); // Filtered list
  const [scheduleData, setScheduleData] = useState({
    projectId: '',
    beneficiaryName: '',
    address: '',
    district: '',
    date: '',
    time: '10:00',
    beneficiaryId: ''
  });
  
  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics/officer-analytics');
      if (response.ok) {
        const data = await response.json();
        // Filter out pending officers (those who don't have a profile yet or are status='pending' in backend)
        setAnalyticsData(data.filter(o => o.status !== 'pending' && o.officerId));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
    fetchAnalytics();
    if (currentUser?.role === 'admin') {
      fetchProjects();
    }
  }, [currentUser?.role]);

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

  const handleEdit = async (officer) => {
    const officerId = officer.officerId || officer.user_id || officer.id;
    console.log("Fetching Full Profile for Officer ID:", officerId);
    
    try {
      const response = await fetch(`http://localhost:5000/api/auth/officers/${officerId}`);
      if (response.ok) {
        const fullData = await response.json();
        console.log("Full Profile Data Received:", fullData);
        
        setEditFormData({
          id: fullData.id,
          firstName: fullData.firstName || '',
          lastName: fullData.lastName || '',
          email: fullData.email || '',
          mobileNumber: fullData.mobileNumber || '',
          ds_division: fullData.ds_division || '',
          vehicleType: fullData.vehicleType || 'None',
          vehicleNumber: fullData.vehicleNumber || '',
          languages: fullData.languages || '',
          organization: fullData.organization || '',
          employee_id: fullData.employee_id || '',
          department: fullData.department || '',
          branch: fullData.branch || '',
          job_title: fullData.job_title || '',
          gender: fullData.gender || '',
          emergency_contact: fullData.emergency_contact || ''
        });
        setIsEditModalOpen(true);
      } else {
        console.error('Failed to fetch officer profile');
        alert('Could not load officer details. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching officer profile:', err);
      alert('Error connecting to server.');
    }
  };

  const handleDeleteClick = (e, officerId) => {
    e.stopPropagation();
    setOfficerToDelete(officerId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!officerToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/auth/officers/${officerToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Officer deleted successfully');
        setIsDeleteModalOpen(false);
        setOfficerToDelete(null);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleUpdateOfficer = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/officers/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (response.ok) {
        alert('Officer updated successfully');
        setIsEditModalOpen(false);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const openScheduleModal = (officer) => {
    setSelectedOfficer(officer);
    setScheduleData({
      projectId: '',
      beneficiaryName: '',
      address: '',
      district: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      beneficiaryId: ''
    });
    setBeneficiaries([]);
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
          officerId: selectedOfficer.officerId,
          beneficiaryId: scheduleData.beneficiaryId,
          beneficiary: scheduleData.beneficiaryName,
          district: scheduleData.district,
          address: scheduleData.address,
          date: scheduleData.date,
          time: scheduleData.time,
          status: 'scheduled'
        })
      });
      if (response.ok) {
        alert('Visit scheduled successfully');
        setIsScheduleModalOpen(false);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Schedule error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = (analyticsData || []).filter(item =>
    (item?.officerName || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (officer) => {
    setSelectedOfficer(officer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOfficer(null);
  };

  return (
    <div className="officers-page-content">
      {redirectMessage && (
        <div className="notification-banner">
          <div className="notification-content">
            <span className="notification-icon">ℹ️</span>
            <p>{redirectMessage}</p>
          </div>
          <button className="close-notification" onClick={() => setRedirectMessage(null)}>&times;</button>
        </div>
      )}
      
      <div className="page-header">
        <div>
          <h1>Field Officers Management</h1>
          <p>Track performance, manage details, and schedule field visits.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="search-section">
          <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
                type="text"
                placeholder="Search by officer name..."
                className="modern-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Fetching performance data...</p>
          </div>
        ) : (
          <div className="officers-grid">
            {filteredData.length > 0 ? (
              filteredData.map((officer, index) => {
                const officerProjects = officer.projects || [];
                const totalBeneficiaries = officerProjects.reduce((sum, p) => sum + (p.beneficiaries?.length || 0), 0);
                const isTopPerformer = index === 0 && (officerProjects.length > 0 || officer.totalVisits > 0);
                const isBusy = (officer.totalVisits || 0) >= 4;
                const uniqueId = officer.officerId || `officer-${index}`;
                
                return (
                  <div key={uniqueId} className={`officer-card ${isTopPerformer ? 'top-performer' : (isBusy ? 'busy-card' : '')}`} onClick={() => openModal(officer)}>
                    <div className="officer-badges">
                      {isTopPerformer && <span className="badge badge-star">Star Performer</span>}
                      {isBusy ? <span className="badge badge-busy">Busy</span> : <span className="badge badge-new">Available</span>}
                    </div>
                    
                    <div className="officer-header">
                      <div className="officer-header-top">
                        <div className="officer-avatar-wrapper">
                          <div className="officer-avatar" style={{ 
                            background: isTopPerformer 
                              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                              : (isBusy ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)'),
                            color: 'white'
                          }}>
                            {(officer.officerName || 'U').charAt(0)}
                          </div>
                          {officer.vehicleType && officer.vehicleType !== 'None' && (
                            <div className="vehicle-badge" title={`${officer.vehicleType}: ${officer.vehicleNumber || 'No plate'}`}>
                              {officer.vehicleType === 'Bike' ? '🏍️' : (officer.vehicleType === 'Car' ? '🚗' : '🚲')}
                            </div>
                          )}
                          <div className="officer-info-main">
                            <h3 className="officer-name">{officer.officerName || 'Unnamed Officer'}</h3>
                            <div className="officer-stats-pills">
                               <div className="stat-pill">📂 {officerProjects.length} Projects</div>
                               <div className="stat-pill">👥 {totalBeneficiaries} Bens</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="officer-metrics">
                        <div className="metric-box">
                          <span className="metric-value">{officer.totalVisits || 0}</span>
                          <span className="metric-label">Field Visits</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-value">{officer.futureVisits?.length || 0}</span>
                          <span className="metric-label">Upcoming</span>
                        </div>
                      </div>

                      {currentUser?.role === 'admin' && (
                        <div className="card-admin-actions" onClick={e => e.stopPropagation()} style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                           <button className="action-btn-schedule" onClick={() => openScheduleModal(officer)} style={{flex: 1, padding: '8px 10px', fontSize: '0.8rem'}}>📅 Schedule</button>
                           <button className="action-btn-edit" onClick={() => handleEdit(officer)} style={{flex: 1, padding: '8px 10px', fontSize: '0.8rem'}}>✏️ Edit</button>
                           <button className="action-btn-delete" onClick={(e) => handleDeleteClick(e, officer.officerId)} style={{flex: 1, padding: '8px 10px', fontSize: '0.8rem'}}>🗑️ Delete</button>
                        </div>
                      )}

                      <div className="card-action-hint">
                        View Detailed Portfolio & Schedule →
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon">👤</span>
                <h3>No Officers Found</h3>
                <p>Try adjusting your search criteria or add new officers.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && selectedOfficer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="modal-avatar" style={{ 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  width: '50px', height: '50px', borderRadius: '12px', color: 'white',
                  display: 'flex', alignItems: 'center', justify: 'center', fontSize: '20px', fontWeight: 'bold'
                }}>
                  {(selectedOfficer.officerName || 'U').charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedOfficer.officerName}</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Officer Portfolio & Field Schedule</p>
                </div>
              </div>
              <button className="close-x" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="profile-grid">
              <div className="profile-section">
                <h3 className="modal-section-title">📊 Active Portfolio</h3>
                <div className="modal-portfolio-list">
                  {(selectedOfficer.projects || []).length > 0 ? (
                    selectedOfficer.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="modal-project-item">
                        <div className="modal-project-header">
                          <span className="modal-project-name">📁 {proj.name}</span>
                          <span className="modal-ben-count">{proj.beneficiaries?.length || 0} Bens</span>
                        </div>
                        <div className="modal-ben-tags">
                          {proj.beneficiaries?.map((ben, bIdx) => (
                            <span key={bIdx} className="modal-ben-tag">👤 {ben.name}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data-msg">No active projects assigned.</div>
                  )}
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="modal-section-title">📅 Upcoming Field Visits</h3>
                <div className="visits-timeline">
                  {(selectedOfficer.futureVisits || []).length > 0 ? (
                    selectedOfficer.futureVisits.map((visit, vIdx) => (
                      <div key={vIdx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-date">
                            {new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="timeline-ben">Visit to {visit.beneficiary}</div>
                          <div className="timeline-proj">{visit.project}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data-msg">No upcoming field visits recorded.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="close-btn-secondary" onClick={closeModal}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '850px'}}>
            <div className="modal-header-box">
              <h2 style={{margin: 0}}>Edit Field Officer Details</h2>
              <button className="close-x" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateOfficer} className="admin-form" style={{ padding: '30px', overflowY: 'auto', maxHeight: '75vh' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={editFormData.firstName || ''} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} required className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={editFormData.lastName || ''} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} required className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Email (Read-only)</label>
                  <input type="email" value={editFormData.email || ''} readOnly className="modern-input read-only-input" />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" value={editFormData.mobileNumber || ''} onChange={e => setEditFormData({...editFormData, mobileNumber: e.target.value})} required className="modern-input" />
                </div>
                <div className="form-group">
                  <label>DS Division</label>
                  <input type="text" value={editFormData.ds_division || ''} onChange={e => setEditFormData({...editFormData, ds_division: e.target.value})} required className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={editFormData.gender || ''} onChange={e => setEditFormData({...editFormData, gender: e.target.value})} required className="modern-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Languages</label>
                  <input type="text" value={editFormData.languages || ''} placeholder="e.g. English, Sinhala" onChange={e => setEditFormData({...editFormData, languages: e.target.value})} required className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={editFormData.vehicleType || 'None'} onChange={e => setEditFormData({...editFormData, vehicleType: e.target.value})} className="modern-select">
                    <option value="None">None</option>
                    <option value="Bike">Bike</option>
                    <option value="Car">Car</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input type="text" value={editFormData.vehicleNumber || ''} onChange={e => setEditFormData({...editFormData, vehicleNumber: e.target.value})} className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Employee ID (Read-only)</label>
                  <input type="text" value={editFormData.employee_id || ''} readOnly className="modern-input read-only-input" />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <input type="text" value={editFormData.organization || ''} onChange={e => setEditFormData({...editFormData, organization: e.target.value})} className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={editFormData.department || ''} onChange={e => setEditFormData({...editFormData, department: e.target.value})} className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <input type="text" value={editFormData.branch || ''} onChange={e => setEditFormData({...editFormData, branch: e.target.value})} className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Job Title</label>
                  <input type="text" value={editFormData.job_title || ''} onChange={e => setEditFormData({...editFormData, job_title: e.target.value})} className="modern-input" />
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input type="text" value={editFormData.emergency_contact || ''} onChange={e => setEditFormData({...editFormData, emergency_contact: e.target.value})} className="modern-input" />
                </div>
              </div>
              <div className="modal-footer" style={{marginTop: '20px', padding: '20px 0 0 0'}}>
                <button type="button" className="close-btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={isSaving} className="action-btn-view" style={{minWidth: '150px', padding: '10px 24px', borderRadius: '10px'}}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <div className="modal-header-box">
              <div>
                <h2 style={{margin: 0}}>Schedule New Visit</h2>
                <p style={{margin: 0, color: '#64748b', fontSize: '0.9rem'}}>Assigning to {selectedOfficer?.officerName}</p>
              </div>
              <button className="close-x" onClick={() => setIsScheduleModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="admin-form" style={{padding: '30px'}}>
              <div className="form-group">
                <label>Target Project</label>
                <select className="modern-select" value={scheduleData.projectId} onChange={(e) => handleProjectChange(e.target.value)} required>
                  <option value="">Select Project</option>
                  {(projects || []).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Beneficiary</label>
                <select 
                  className="modern-select" 
                  value={scheduleData.beneficiaryId} 
                  onChange={(e) => handleBeneficiaryChange(e.target.value)} 
                  required 
                  disabled={!scheduleData.projectId}
                >
                  <option value="">Select Beneficiary</option>
                  {(beneficiaries || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
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
              <div className="form-grid">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="modern-input" value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input type="time" className="modern-input" value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer" style={{marginTop: '20px', padding: '20px 0 0 0'}}>
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="close-btn-secondary">Cancel</button>
                <button type="submit" disabled={isSaving} className="action-btn-view" style={{minWidth: '150px', padding: '10px 24px', borderRadius: '10px'}}>{isSaving ? 'Scheduling...' : 'Create Visit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '400px',
            textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
             <div style={{fontSize: '50px', marginBottom: '20px'}}>⚠️</div>
             <h2 style={{color: '#111827', marginBottom: '10px'}}>Are you sure?</h2>
             <p style={{color: '#6b7280', marginBottom: '30px', fontSize: '15px'}}>
               Do you really want to delete this field officer? This action cannot be undone.
             </p>
             <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
               <button 
                 onClick={() => setIsDeleteModalOpen(false)} 
                 className="close-btn-secondary"
                 style={{flex: 1, padding: '12px'}}
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmDelete} 
                 className="action-btn-delete"
                 style={{
                   flex: 1, padding: '12px', border: 'none', borderRadius: '10px', 
                   fontWeight: '700', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white'
                 }}
               >
                 Yes, Delete
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldOfficers;