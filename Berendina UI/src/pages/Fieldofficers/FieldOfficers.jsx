import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './FieldOfficers.css';
import { DS_DIVISIONS } from '../../constants/locations';

const FieldOfficers = () => {
  const location = useLocation();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState(location.state?.message || null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'unavailable'
  
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
          gender: fullData.gender || '',
          emergency_contact: fullData.emergency_contact || '',
          languages: fullData.languages ? fullData.languages.split(', ') : [],
          // Preserve these fields to prevent data loss on update
          organization: fullData.organization || '',
          employee_id: fullData.employee_id || '',
          department: fullData.department || '',
          branch: fullData.branch || '',
          job_title: fullData.job_title || ''
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
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageToggle = (lang) => {
    const currentLangs = editFormData.languages || [];
    if (currentLangs.includes(lang)) {
      setEditFormData({ ...editFormData, languages: currentLangs.filter(l => l !== lang) });
    } else {
      setEditFormData({ ...editFormData, languages: [...currentLangs, lang] });
    }
  };

  const toggleAvailability = async (officerId, currentStatus, e) => {
    e.stopPropagation();
    
    // Optimistic UI Update
    const previousData = [...analyticsData];
    setAnalyticsData(prev => prev.map(off => 
      off.officerId === officerId ? { ...off, isAvailable: !currentStatus } : off
    ));

    try {
      const response = await fetch(`http://localhost:5000/api/auth/officers/${officerId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus, updatedByRole: 'admin' })
      });
      if (!response.ok) {
        throw new Error('Failed to update availability');
      }
      // Reload counts/data silently in background
      const res = await fetch('http://localhost:5000/api/analytics/officer-analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.filter(o => o.status !== 'pending' && o.officerId));
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      // Rollback on error
      setAnalyticsData(previousData);
      alert('Error updating availability. Please try again.');
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

  const tabFilteredData = filteredData.filter(off => 
    activeTab === 'available' ? off.isAvailable !== false : off.isAvailable === false
  );

  const availableCount = filteredData.filter(off => off.isAvailable !== false).length;
  const unavailableCount = filteredData.filter(off => off.isAvailable === false).length;

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

        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available <span className="tab-count">{availableCount}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'unavailable' ? 'active' : ''}`}
            onClick={() => setActiveTab('unavailable')}
          >
            Unavailable <span className="tab-count">{unavailableCount}</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Fetching performance data...</p>
          </div>
        ) : (
          <div className="beneficiary-grid">
            {tabFilteredData.length > 0 ? (
              tabFilteredData.map((officer, index) => {
                const officerProjects = officer.projects || [];
                const totalBeneficiaries = officerProjects.reduce((sum, p) => sum + (p.beneficiaries?.length || 0), 0);
                const isBusy = (officer.totalVisits || 0) >= 4;
                
                // Status Logic
                let statusLabel = 'Available';
                let statusClass = 'active';
                let accentColor = '#10b981';

                if (officer.isAvailable === false) {
                  statusLabel = 'Unavailable';
                  statusClass = 'inactive';
                  accentColor = '#64748b';
                } else if (isBusy) {
                  statusLabel = 'Busy';
                  statusClass = 'inactive'; // or a new 'busy' class
                  accentColor = '#ef4444';
                }

                const uniqueId = officer.officerId || `officer-${index}`;
                
                return (
                  <div key={uniqueId} className="beneficiary-card" onClick={() => openModal(officer)}>
                    <div className="card-status-accent" style={{ 
                      background: accentColor 
                    }}></div>
                    <div className="card-content">
                      <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div className="mini-avatar" style={{
                             width: '32px', height: '32px', borderRadius: '8px', 
                             background: isBusy ? '#fee2e2' : '#dcfce7',
                             color: isBusy ? '#b91c1c' : '#15803d',
                             display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px'
                           }}>
                             {(officer.officerName || 'U').charAt(0)}
                           </div>
                           <h3 style={{ margin: 0, fontSize: '18px' }}>{officer.officerName}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button 
                            onClick={(e) => toggleAvailability(officer.officerId, officer.isAvailable, e)}
                            style={{
                              background: officer.isAvailable ? '#dcfce7' : '#f1f5f9',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '5px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title={officer.isAvailable ? 'Status: Active - Click to set Unavailable' : 'Status: Unavailable - Click to set Available'}
                          >
                             <div style={{
                               width: '10px',
                               height: '10px',
                               borderRadius: '50%',
                               background: officer.isAvailable ? '#10b981' : '#64748b'
                             }}></div>
                          </button>
                          <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                        </div>
                      </div>
                      
                      <div className="card-details">
                        <div className="detail-item">
                          <span className="label">DS Division</span>
                          <span className="value">{officer.dsDivision || 'Not Set'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Workload</span>
                          <span className="value">{officerProjects.length} Proj / {totalBeneficiaries} Bens</span>
                        </div>
                      </div>

                      <div className="card-progress">
                        <div className="progress-info">
                          <span>Field Visits</span>
                          <span>{officer.totalVisits || 0} Total</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-bar-fill" style={{ 
                            width: `${Math.min((officer.totalVisits || 0) * 20, 100)}%`,
                            background: isBusy ? '#ef4444' : '#3b82f6'
                          }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
                          📅 {officer.futureVisits?.length || 0} Upcoming Visits
                        </div>
                      </div>

                      <div className="card-actions" onClick={e => e.stopPropagation()}>
                        <button className="action-btn-schedule" onClick={() => openScheduleModal(officer)}>Schedule</button>
                        <button className="action-btn-edit" onClick={() => handleEdit(officer)}>Edit</button>
                        <button className="action-btn-delete" onClick={(e) => handleDeleteClick(e, officer.officerId)}>Delete</button>
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
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold'
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
                  <label>Gender</label>
                  <select value={editFormData.gender || ''} onChange={e => setEditFormData({...editFormData, gender: e.target.value})} required className="modern-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
                  <label>Emergency Contact</label>
                  <input type="text" value={editFormData.emergency_contact || ''} onChange={e => setEditFormData({...editFormData, emergency_contact: e.target.value})} className="modern-input" />
                </div>
                <div className="form-group">
                  <label>DS Division</label>
                  <select 
                    value={editFormData.ds_division || ''} 
                    onChange={e => setEditFormData({...editFormData, ds_division: e.target.value})} 
                    required 
                    className="modern-select"
                  >
                    <option value="">Select Division</option>
                    {DS_DIVISIONS.map(ds => (
                      <option key={ds} value={ds}>{ds}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Languages</label>
                  <div className="checkbox-group" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    {['Sinhala', 'Tamil', 'English'].map(lang => (
                      <label key={lang} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={(editFormData.languages || []).includes(lang)} 
                          onChange={() => handleLanguageToggle(lang)} 
                        /> 
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={editFormData.vehicleType || 'None'} onChange={e => setEditFormData({...editFormData, vehicleType: e.target.value})} className="modern-select">
                    <option value="None">None</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Car">Car</option>
                    <option value="Three Wheel">Three Wheel</option>
                  </select>
                </div>
                {editFormData.vehicleType && editFormData.vehicleType !== 'None' && (
                  <div className="form-group">
                    <label>Vehicle Number</label>
                    <input type="text" value={editFormData.vehicleNumber || ''} onChange={e => setEditFormData({...editFormData, vehicleNumber: e.target.value})} className="modern-input" placeholder="Ex: CP-ABC-1234" />
                  </div>
                )}
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
                <select 
                  className="modern-select" 
                  value={scheduleData.projectId} 
                  onChange={(e) => handleProjectChange(e.target.value)} 
                  required
                >
                  <option value="">Select Project</option>
                  {selectedOfficer?.projects && selectedOfficer.projects.length > 0 ? (
                    selectedOfficer.projects.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name}</option>
                    ))
                  ) : (
                    <option disabled>No projects assigned to this officer</option>
                  )}
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