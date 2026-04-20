import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Beneficiaries.css';
import { PROJECT_MILESTONES, getMilestoneFromValue } from '../../utils/progressConstants';

// Screen to see everyone who get help
const Beneficiaries = () => {  
  const navigate = useNavigate();  
  const [searchTerm, setSearchTerm] = useState('');  
  const [beneficiaries, setBeneficiaries] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [projectList, setProjectList] = useState([]);  
  const [officerList, setOfficerList] = useState([]);  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);  
  const [deletingBen, setDeletingBen] = useState(null);  
  const [isDeleting, setIsDeleting] = useState(false);  
  
  // Holder for info of one person when we click them
  const [selectedBen, setSelectedBen] = useState({    
    firstName: '', lastName: '', name: '', nic: '', dob: '', gender: '', contact: '',     
    dsDivision: '', address: '', maritalStatus: '',     
    familyMembers: '', monthlyIncome: '', occupation: '', project: '', status: 'active',    
    documents: []  
  });  
  
  const [selectedFiles, setSelectedFiles] = useState([]);  
  const [isUpdating, setIsUpdating] = useState(false);  
  const [history, setHistory] = useState([]);  
  const [newProgress, setNewProgress] = useState({ value: 0, comment: '' });  
  const currentUser = JSON.parse(sessionStorage.getItem('user'));  
  const isOfficer = currentUser?.role === 'officer';  

  // here we bring the list of people from the server
  // Ask server for list of people getting help
  const fetchData = async () => {    
    setLoading(true);    
    try {      
      const officerId = currentUser?.id;      
      if (isOfficer && !officerId) {        
        alert('Authentication Error: Your officer ID was not found. Please re-login.');        
        setLoading(false);        
        return;      
      }      
      
      const benUrl = isOfficer         
        ? `http://localhost:5000/api/beneficiaries?officerId=${officerId}`         
        : 'http://localhost:5000/api/beneficiaries';      
      
      const [benRes, projRes, offRes] = await Promise.all([        
        fetch(benUrl),        
        fetch('http://localhost:5000/api/projects'),        
        fetch('http://localhost:5000/api/auth/officers')      
      ]);      
      
      if (benRes.ok) {        
        const data = await benRes.json();        
        setBeneficiaries(data);      
      }      
      
      if (projRes.ok) setProjectList(await projRes.json());      
      if (offRes.ok) setOfficerList(await offRes.json());    
    } catch (err) {      
      alert("Network Error: Could not connect to the database.");    
    } finally {      
      setLoading(false);    
    }  
  };  

  // do this as soon as page open!
  // Bring all names when screen first open
  useEffect(() => {    
    fetchData();  
  }, []);  

  const handleEditClick = (e, ben) => {    
    e.stopPropagation(); 
    setSelectedBen({ ...ben, documents: ben.documents || [] });    
    setSelectedFiles([]);    
    setIsViewModalOpen(false); 
    setIsModalOpen(true);  
  };  

  // Show full details when name is clicked
  const handleRowClick = (ben) => {    
    setSelectedBen({ ...ben, documents: ben.documents || [] });    
    setIsViewModalOpen(true);  
  };  

  // Show history of how person is doing
  const handleProgressClick = async (ben) => {    
    setSelectedBen(ben);    
    const currentMilestone = getMilestoneFromValue(ben.progress || 0);    
    setNewProgress({         
      value: ben.progress || 0,         
      comment: '',        
      phaseLabel: currentMilestone.label    
    });    
    setIsHistoryModalOpen(true);    
    try {      
      const res = await fetch(`http://localhost:5000/api/beneficiaries/${ben.id}/history`);      
      if (res.ok) setHistory(await res.json());    
    } catch (err) {    
    }  
  };  

  const handleInputChange = (e) => {    
    const { name, value } = e.target;    
    setSelectedBen(prev => ({ ...prev, [name]: value }));  
  };  

  const handleFileChange = (e) => {    
    setSelectedFiles(Array.from(e.target.files));  
  };  

  // Save any changes to person info
  const handleUpdateSubmit = async (e) => {    
    e.preventDefault();    
    setIsUpdating(true);    
    const data = new FormData();    
    Object.keys(selectedBen).forEach(key => {      
      if (key !== 'documents') {        
        data.append(key, selectedBen[key]);      
      }    
    });    
    selectedFiles.forEach(file => {      
      data.append('documents', file);    
    });    
    try {      
      const response = await fetch(`http://localhost:5000/api/beneficiaries/${selectedBen.id}`, {        
        method: 'PUT',        
        body: data,      
      });      
      if (response.ok) {        
        alert("Beneficiary profile updated successfully!");        
        setIsModalOpen(false);        
        await fetchData();      
      } else {        
        const errorData = await response.json();        
        alert(`Error: ${errorData.message}`);      
      }    
    } catch (err) {      
      alert("Error: Connection to the server was lost while updating. Please check your internet.");    
    } finally {      
      setIsUpdating(false);    
    }  
  };  

  const promptDelete = (e, ben) => {    
    e.stopPropagation();    
    setDeletingBen(ben);  
  };  

  // Remove person from our list forever
  const confirmDelete = async () => {    
    if (!deletingBen) return;    
    setIsDeleting(true);    
    try {      
      const response = await fetch(`http://localhost:5000/api/beneficiaries/${deletingBen.id}`, {        
        method: 'DELETE'      
      });      
      if (response.ok) {        
        alert('Beneficiary deleted successfully!');        
        setDeletingBen(null);        
        fetchData();      
      } else {        
        const contentType = response.headers.get("content-type");        
        if (contentType && contentType.indexOf("application/json") !== -1) {          
          const errorData = await response.json();          
          alert(`Error: ${errorData.message}`);        
        } else {          
          alert(`Server Error (${response.status}). Please try again later.`);        
        }      
      }    
    } catch (error) {      
      alert('Error: Unable to delete the beneficiary due to a server connection failure.');    
    } finally {      
      setIsDeleting(false);    
    }  
  };  

  // Save new update on how person is doing
  const handleProgressSubmit = async (e) => {    
    e.preventDefault();    
    setIsUpdating(true);    
    try {      
      const response = await fetch(`http://localhost:5000/api/beneficiaries/${selectedBen.id}/progress`, {        
        method: 'PUT',        
        headers: { 'Content-Type': 'application/json' },        
        body: JSON.stringify({ progress: newProgress.value, comment: newProgress.comment }),      
      });      
      if (response.ok) {        
        alert("Progress updated and logged!");        
        setIsHistoryModalOpen(false);        
        fetchData();      
      }    
    } catch (err) {      
      alert("Error: Failed to process progress update. Please try again.");    
    } finally {      
      setIsUpdating(false);    
    }  
  };  

  // Find people when we type in search box
  const filteredBeneficiaries = beneficiaries.filter(ben => {    
    const matchesSearch = ben.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||                         
                         ben.contact?.includes(searchTerm);    
    if (isOfficer) {      
      return matchesSearch && ben.assigned_officer_id === currentUser?.id;    
    }    
    return matchesSearch;  
  });  

  // This is what is shown on the screen
  return (    
    <div className="beneficiaries-page-content">      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>        
        <div>          
          <h1>Beneficiaries</h1>          
          <p>Manage and track all beneficiaries in your programs</p>        
        </div>        
        <button className="add-project-btn" onClick={() => navigate('/beneficiary-form')}>          
          + Add Beneficiary        
        </button>      
      </div>      
      <div className="content-card">        
        <div className="search-section">          
          <div className="search-wrapper">             
             <span className="search-icon">🔍</span>             
             <input                
                type="text"                
                placeholder="Search beneficiaries..."                
                className="modern-input"                
                value={searchTerm}                
                onChange={(e) => setSearchTerm(e.target.value)}              
              />          
          </div>        
        </div>        
        {loading ? (             
             <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>          
          ) : (            
            isOfficer ? (              
              <div className="beneficiary-grid">                
                {filteredBeneficiaries.length > 0 ? (                  
                  filteredBeneficiaries.map(ben => (                    
                    <div key={ben.id} className="beneficiary-card" onClick={() => handleRowClick(ben)}>                       
                       <div className="card-status-accent" style={{                          
                          background: ben.status?.toLowerCase() === 'active' ? '#10b981' : (ben.status?.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444')                        
                        }}></div>                       
                       <div className="card-content">                         
                         <div className="card-header">                           
                           <h3>{ben.name}</h3>                           
                           <span className={`status-badge ${ben.status?.toLowerCase()}`}>{ben.status}</span>                         
                         </div>                         
                         <div className="card-details">                           
                           <div className="detail-item">                             
                             <span className="label">DS Division</span>                             
                             <span className="value">{ben.dsDivision || 'Not Specified'}</span>                           
                           </div>                           
                           <div className="detail-item">                             
                             <span className="label">Project</span>                             
                             <span className="value">{ben.project || 'Unassigned'}</span>                           
                           </div>                         
                         </div>                         
                         <div className="card-progress">                            
                            <div className="progress-info">                              
                              <span>Overall Progress</span>                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>                                
                                <span style={{ fontWeight: '700', color: '#1d4ed8' }}>{ben.progress}%</span>                                
                                <button                                   
                                   onClick={(e) => { e.stopPropagation(); handleProgressClick(ben); }}                                  
                                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', padding: 0 }}                                
                                >                                  
                                  Update                                
                                </button>                              
                              </div>                            
                            </div>                            
                            <div className="progress-track">                               
                               <div className="progress-bar-fill" style={{ width: `${ben.progress}%` }}></div>                            
                            </div>                         
                         </div>                         
                         <div className="card-actions" onClick={e => e.stopPropagation()}>                           
                           <button className="action-btn-view" onClick={(e) => handleEditClick(e, ben)}>Edit Profile</button>                           
                           <button className="action-btn-history" onClick={(e) => handleProgressClick(ben)}>Update Progress</button>                         
                         </div>                       
                       </div>                    
                    </div>                  
                  ))                
                ) : (                  
                  <div className="empty-state">No beneficiaries assigned yet.</div>                
                )}              
              </div>            
            ) : (              
              <div className="table-responsive">                
                <table className="modern-table">                  
                  <thead>                    
                    <tr>                      
                      <th>NAME</th><th>CONTACT</th><th>PROJECT</th><th>OFFICER</th><th>STATUS</th><th>DOCS</th><th>PROGRESS</th><th>ACTIONS</th>                    
                    </tr>                  
                  </thead>                  
                  <tbody>                    
                    {filteredBeneficiaries.map(ben => (                      
                      <tr key={ben.id} onClick={() => handleRowClick(ben)} className="clickable-row">                        
                        <td className="font-medium" style={{ color: '#1e293b' }}>{ben.name}</td>                        
                        <td>{ben.contact}</td>                        
                        <td>{ben.project || 'Unassigned'}</td>                        
                        <td>                            
                            <span className="officer-badge" style={{ fontSize: '0.8rem', color: '#64748b' }}>                                
                                👤 {ben.assigned_officer_name || 'Not Assigned'}                            
                            </span>                        
                        </td>                        
                        <td><span className={`status-badge ${ben.status?.toLowerCase()}`}>{ben.status}</span></td>                        
                        <td>{ben.documents?.length || 0} files</td>                        
                        <td>                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>                            
                            {ben.progress}%                            
                            <button                               
                               onClick={(e) => { e.stopPropagation(); handleProgressClick(ben); }}                              
                              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}                            
                            >                              
                              Update                            
                            </button>                          
                          </div>                        
                        </td>                        
                        <td>                          
                          <div className="action-group" style={{display: 'flex', gap: '8px'}}>                            
                            <button className="action-btn-view" onClick={(e) => handleEditClick(e, ben)}>Edit</button>                            
                            <button className="action-btn-delete" onClick={(e) => promptDelete(e, ben)} style={{                              
                              backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'                            
                            }}>Delete</button>                          
                          </div>                        
                        </td>                      
                      </tr>                    
                    ))}                  
                  </tbody>                
                </table>              
              </div>            
            )          
          )}      
      </div>      
      
      {isViewModalOpen && (        
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>          
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>            
            <div className="modal-header-box">              
              <h2>Beneficiary Profile</h2>              
              <div className="modal-actions">                 
                 <button className="edit-profile-btn" onClick={(e) => handleEditClick(e, selectedBen)}>                   
                   Update Profile                 
                 </button>                 
                 <button className="close-x" onClick={() => setIsViewModalOpen(false)}>&times;</button>              
              </div>            
            </div>            
            <div className="profile-grid">              
              
              <div className="profile-section">                
                <h3>Personal Information</h3>                
                <div className="info-row">                  
                  <div className="info-group">                    
                    <label>First Name</label>                    
                    <span>{selectedBen.firstName}</span>                  
                  </div>                  
                  <div className="info-group">                    
                    <label>Last Name</label>                    
                    <span>{selectedBen.lastName}</span>                  
                  </div>                
                </div>                
                <div className="info-row">                  
                  <div className="info-group">                    
                    <label>NIC Number</label>                    
                    <span>{selectedBen.nic || 'N/A'}</span>                  
                  </div>                  
                  <div className="info-group">                    
                    <label>Date of Birth</label>                    
                    <span>{selectedBen.dob ? new Date(selectedBen.dob).toLocaleDateString() : 'N/A'}</span>                  
                  </div>                
                </div>                
                <div className="info-row">                  
                  <div className="info-group">                    
                    <label>Gender</label>                    
                    <span>{selectedBen.gender || 'N/A'}</span>                  
                  </div>                  
                  <div className="info-group">                    
                    <label>Contact Number</label>                    
                    <span>{selectedBen.contact}</span>                  
                  </div>                
                </div>              
              </div>              
              
              <div className="profile-section">                
                <h3>Location & Status</h3>                
                <div className="info-row">                   
                   <div className="info-group">                     
                     <label>DS Division</label>                     
                     <span>{selectedBen.dsDivision || 'N/A'}</span>                   
                   </div>                
                </div>                
                <div className="info-group">                  
                  <label>Full Address</label>                  
                  <span>{selectedBen.address || 'N/A'}</span>                
                </div>                
                <div className="info-row">                   
                   <div className="info-group">                     
                     <label>Program/Project</label>                     
                     <span className="project-tag">{selectedBen.project || 'Unassigned'}</span>                   
                   </div>                   
                   <div className="info-group">                     
                     <label>Current Status</label>                     
                     <span className={`status-badge ${selectedBen.status?.toLowerCase()}`}>{selectedBen.status}</span>                   
                   </div>                
                </div>                
                <div className="info-group" style={{ marginTop: '10px' }}>                    
                    <label>Assigned Field Officer</label>                    
                    <span className="officer-tag" style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.85rem' }}>                        
                        🚜 {selectedBen.assigned_officer_name || 'Not assigned'}                    
                    </span>                
                </div>              
              </div>              
              
              <div className="profile-section wide">                
                <h3>Socio-Economic Details</h3>                
                <div className="info-grid-3">                   
                   <div className="info-group">                     
                     <label>Marital Status</label>                     
                     <span>{selectedBen.maritalStatus || 'N/A'}</span>                   
                   </div>                   
                   <div className="info-group">                     
                     <label>Family Members</label>                     
                     <span>{selectedBen.familyMembers || '0'}</span>                   
                   </div>                   
                   <div className="info-group">                     
                     <label>Monthly Income (LKR)</label>                     
                     <span>{selectedBen.monthlyIncome ? parseInt(selectedBen.monthlyIncome).toLocaleString() : '0'}</span>                   
                   </div>                
                </div>                
                <div className="info-group">                  
                  <label>Primary Occupation</label>                  
                  <span>{selectedBen.occupation || 'N/A'}</span>                
                </div>              
              </div>              
              
              <div className="profile-section wide">                
                <h3>Uploaded Documents</h3>                
                <div className="docs-viewer">                  
                  {selectedBen.documents?.length > 0 ? (                    
                    selectedBen.documents.map((doc, idx) => (                      
                      <a key={idx} href={`http://localhost:5000${doc}`} target="_blank" rel="noreferrer" className="doc-link">                         
                         📄 {doc.split('/').pop().split('-').slice(1).join('-')}                      
                      </a>                    
                    ))                  
                  ) : (                    
                    <p className="no-docs">No documents attached to this profile.</p>                  
                  )}                
                </div>              
              </div>            
            </div>            
            <div className="modal-footer">               
               <button className="close-btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close View</button>            
            </div>          
          </div>        
        </div>      
      )}      
      
      {isHistoryModalOpen && (        
        <div className="modal-overlay" style={{          
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',           
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',          
          zIndex: 1000        
        }}>          
          <div className="modal-content" style={{            
            background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto'          
          }}>            
            <h2 style={{ marginBottom: '20px' }}>Project Progress: {selectedBen.name || (selectedBen.firstName + ' ' + selectedBen.lastName)}</h2>            
            <form onSubmit={handleProgressSubmit} style={{ marginBottom: '30px', background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>              
              <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: '#1e293b' }}>Update Project Phase</h3>              
              <div className="milestone-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>                
                {PROJECT_MILESTONES.map(m => (                  
                  <button                    
                    key={m.label}                    
                    type="button"                    
                    onClick={() => setNewProgress({...newProgress, value: m.value, phaseLabel: m.label})}                    
                    style={{                      
                      padding: '12px 8px',                      
                      borderRadius: '8px',                      
                      border: '2px solid',                      
                      borderColor: newProgress.value === m.value ? '#3b82f6' : '#e2e8f0',                      
                      background: newProgress.value === m.value ? '#eff6ff' : 'white',                      
                      color: newProgress.value === m.value ? '#1d4ed8' : '#64748b',                      
                      fontSize: '0.8rem',                      
                      fontWeight: '600',                      
                      cursor: 'pointer',                      
                      transition: 'all 0.2s',                      
                      display: 'flex',                      
                      flexDirection: 'column',                      
                      alignItems: 'center',                      
                      gap: '4px'                    
                    }}                  
                  >                    
                    <span style={{ fontSize: '1.1rem' }}>                      
                      {m.value === 5 && '📝'}                      
                      {m.value === 25 && '📚'}                      
                      {m.value === 50 && '📦'}                      
                      {m.value === 80 && '🔍'}                      
                      {m.value === 100 && '🎓'}                    
                    </span>                    
                    {m.label.split('. ')[1]}                    
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{m.value}%</span>                  
                  </button>                
                ))}              
              </div>              
              <div style={{ marginBottom: '15px' }}>                
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Progress Note / Comment</label>                
                <textarea                   
                  placeholder="Why is it changing? E.g. 'Completed the entrepreneurship course'"                  
                  value={newProgress.comment}                  
                  onChange={(e) => setNewProgress({...newProgress, comment: e.target.value})}                  
                  className="modern-input"                  
                  style={{ minHeight: '80px', paddingTop: '10px' }}                
                />              
              </div>              
              <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', marginBottom: '20px', fontSize: '0.8rem', color: '#92400e' }}>                
                💡 <strong>Current Phase:</strong> {newProgress.phaseLabel || 'Not Set'} ({newProgress.value}%)              
              </div>              
              <button type="submit" disabled={isUpdating} className="save-btn" style={{ width: '100%', padding: '14px' }}>                
                {isUpdating ? 'Saving Update...' : 'Confirm Phase Update'}              
              </button>            
            </form>            
            <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Past Updates</h3>            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>              
              {history.length === 0 ? (                
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No history found.</p>              
              ) : (                
                history.map(item => (                  
                  <div key={item.history_id} style={{ padding: '10px', borderLeft: '3px solid #3b82f6', background: '#f1f5f9' }}>                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>                      
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.progress_value}%</span>                      
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(item.update_date).toLocaleDateString()}</span>                    
                    </div>                    
                    <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>{item.comment}</p>                  
                  </div>                
                ))              
              )
              }            
            </div>            
            <button               
               onClick={() => setIsHistoryModalOpen(false)}              
              className="cancel-btn" style={{ width: '100%', marginTop: '20px' }}            
            >              
              Close            
            </button>          
          </div>        
        </div>      
      )}      
      
      {isModalOpen && (        
        <div className="modal-overlay" style={{          
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',           
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',          
          zIndex: 1000        
        }}>          
          <div className="modal-content" style={{            
            background: 'white', padding: 0, borderRadius: '16px', width: '100%', maxWidth: '850px',             
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'          
          }}>            
            <h2 style={{ padding: '25px 35px', margin: 0, color: '#1e293b', borderBottom: '1px solid #eee', flexShrink: 0 }}>Update Beneficiary Profile</h2>            
            <form onSubmit={handleUpdateSubmit} style={{ flex: 1, overflowY: 'auto', padding: '35px' }}>              
              
              <div style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>                
                <h3 style={{ fontSize: '1rem', fontBold: '700', marginBottom: '15px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>First Name</label>                    
                    <input type="text" name="firstName" value={selectedBen.firstName} onChange={handleInputChange} className="modern-input" required />                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Last Name</label>                    
                    <input type="text" name="lastName" value={selectedBen.lastName} onChange={handleInputChange} className="modern-input" required />                  
                  </div>                
                </div>                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>NIC Number</label>                    
                    <input type="text" name="nic" value={selectedBen.nic} onChange={handleInputChange} className="modern-input" />                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Mobile Number</label>                    
                    <input type="text" name="contact" value={selectedBen.contact} onChange={handleInputChange} className="modern-input" required />                  
                  </div>                
                </div>                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Date of Birth</label>                    
                    <input type="date" name="dob" value={selectedBen.dob ? selectedBen.dob.split('T')[0] : ''} onChange={handleInputChange} className="modern-input" />                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Gender</label>                    
                    <select name="gender" value={selectedBen.gender || ''} onChange={handleInputChange} className="modern-select">                      
                      <option value="">Select Gender</option>                      
                      <option value="Male">Male</option>                      
                      <option value="Female">Female</option>                      
                      <option value="Other">Other</option>                    
                    </select>                  
                  </div>                
                </div>              
              </div>              
              
              <div style={{ marginBottom: '25px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>                
                <h3 style={{ fontSize: '1rem', fontBold: '700', marginBottom: '15px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location & Program</h3>                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '15px' }}>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>DS Division</label>                    
                    <input type="text" name="dsDivision" value={selectedBen.dsDivision || ''} onChange={handleInputChange} className="modern-input" placeholder="e.g. Maharagama" />                  
                  </div>                
                </div>                
                <div style={{ marginBottom: '15px' }}>                  
                  <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Exact Address</label>                  
                  <input type="text" name="address" value={selectedBen.address || ''} onChange={handleInputChange} className="modern-input" placeholder="Door No, Street, Village" />                
                </div>                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Assigned Project</label>                    
                    <select name="project" value={selectedBen.project} onChange={handleInputChange} className="modern-select">                      
                      <option value="">Select Project</option>                      
                      {projectList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}                    
                    </select>                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Field Officer</label>                    
                    <select name="assigned_officer_id" value={selectedBen.assigned_officer_id || ''} onChange={handleInputChange} className="modern-select">                        
                        <option value="">Unassigned</option>                        
                        {officerList.map(off => (                            
                            <option key={off.id} value={off.id}>{off.firstName} {off.lastName}</option>                        
                        ))}                    
                    </select>                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Status</label>                    
                    <select name="status" value={selectedBen.status} onChange={handleInputChange} className="modern-select">                      
                      <option value="active">Active</option>                      
                      <option value="inactive">Inactive</option>                      
                      <option value="pending">Pending</option>                    
                    </select>                  
                  </div>                
                </div>              
              </div>              
              
              <div style={{ marginBottom: '25px', padding: '20px', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>                
                <h3 style={{ fontSize: '1rem', fontBold: '700', marginBottom: '15px', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Socio-Economic Data</h3>                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#bc4a1d' }}>Marital Status</label>                    
                    <select name="maritalStatus" value={selectedBen.maritalStatus || ''} onChange={handleInputChange} className="modern-select">                      
                      <option value="">Select Status</option>                      
                      <option value="Single">Single</option>                      
                      <option value="Married">Married</option>                      
                      <option value="Widowed">Widowed</option>                      
                      <option value="Divorced">Divorced</option>                    
                    </select>                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#bc4a1d' }}>Family Members</label>                    
                    <input                       
                       type="number"                       
                       name="familyMembers"                       
                       value={selectedBen.familyMembers === 0 ? '0' : (selectedBen.familyMembers || '')}                       
                       onChange={handleInputChange}                       
                       className="modern-input"                       
                       min="0"                     
                     />                  
                  </div>                  
                  <div>                    
                    <label style={{ fontSize: '0.85rem', color: '#bc4a1d' }}>Monthly Income (LKR)</label>                    
                    <input                       
                       type="number"                       
                       name="monthlyIncome"                       
                       value={selectedBen.monthlyIncome === 0 ? '0' : (selectedBen.monthlyIncome || '')}                       
                       onChange={handleInputChange}                       
                       className="modern-input"                       
                       min="0"                     
                     />                  
                  </div>                
                </div>                
                <div>                  
                  <label style={{ fontSize: '0.85rem', color: '#bc4a1d' }}>Primary Occupation</label>                  
                  <input                     
                     type="text"                     
                     name="occupation"                     
                     value={selectedBen.occupation || ''}                     
                     onChange={handleInputChange}                     
                     className="modern-input"                     
                     placeholder="e.g. Self-employed, Farmer"                   
                   />                
                </div>              
              </div>              
              
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>                
                <h3 style={{ fontSize: '1rem', fontBold: '700', marginBottom: '15px', color: '#475569', textTransform: 'uppercase' }}>Documents & Photos</h3>                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>                  
                  {selectedBen.documents?.length > 0 ? selectedBen.documents.map((doc, idx) => (                    
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>                      
                      <span style={{ fontSize: '0.85rem' }}>📄 {doc.split('/').pop().split('-').slice(1).join('-')}</span>                      
                      <a href={`http://localhost:5000${doc}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600' }}>View File</a>                    
                    </div>                  
                  )) : <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>No documents uploaded.</p>}                
                </div>                
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#475569' }}>Upload Additional Supporting Files</label>                
                <input type="file" multiple onChange={handleFileChange} className="modern-input" style={{ padding: '8px' }} />              
              </div>              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', background: 'white', position: 'sticky', bottom: '-35px', paddingBottom: '35px' }}>                
                <button type="button" onClick={() => setIsModalOpen(false)} className="close-btn-secondary">Cancel</button>                
                <button type="submit" disabled={isUpdating} className="save-btn" style={{ minWidth: '160px' }}>                  
                  {isUpdating ? "Saving Changes..." : "Update Comprehensive Profile"}                
                </button>              
              </div>            
            </form>          
          </div>        
        </div>      
      )}      
      
      {deletingBen && (        
        <div className="modal-overlay" style={{          
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',           
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',          
          zIndex: 2000        
        }}>          
          <div className="modal-content delete-modal" style={{            
            background: 'white', padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '400px',            
            textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'          
          }}>             
             <div style={{fontSize: '50px', marginBottom: '20px'}}>⚠️</div>             
             <h2 style={{color: '#111827', marginBottom: '10px'}}>Are you sure?</h2>             
             <p style={{color: '#6b7280', marginBottom: '30px', fontSize: '15px'}}>               
               Do you really want to delete <strong>{deletingBen.firstName} {deletingBen.lastName}</strong>? This action cannot be undone.             
             </p>             
             <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>               
               <button                  
                  onClick={() => setDeletingBen(null)}                  
                  className="cancel-btn"                 
                 disabled={isDeleting}                 
                 style={{flex: 1, padding: '12px'}}               
               >                 
                 Cancel               
               </button>               
               <button                  
                  onClick={confirmDelete}                  
                  className="delete-confirm-btn"                 
                 disabled={isDeleting}                 
                 style={{                   
                   flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white',                    
                   border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer'                 
                 }}               
               >                 
                 {isDeleting ? 'Deleting...' : 'Yes, Delete'}               
               </button>             
             </div>          
          </div>        
        </div>      
      )}    
    </div>  
  );
};

export default Beneficiaries;