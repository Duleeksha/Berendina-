import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Beneficiaries.css';

const Beneficiaries = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectList, setProjectList] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [deletingBen, setDeletingBen] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedBen, setSelectedBen] = useState({
    name: '', nic: '', dob: '', gender: '', contact: '', 
    district: '', dsDivision: '', address: '', maritalStatus: '', 
    familyMembers: '', monthlyIncome: '', occupation: '', project: '', status: 'active',
    documents: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Progress states
  const [history, setHistory] = useState([]);
  const [newProgress, setNewProgress] = useState({ value: 0, comment: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [benRes, projRes] = await Promise.all([
        fetch('http://localhost:5000/api/beneficiaries'),
        fetch('http://localhost:5000/api/projects')
      ]);
      if (benRes.ok) setBeneficiaries(await benRes.json());
      if (projRes.ok) setProjectList(await projRes.json());
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (e, ben) => {
    e.stopPropagation(); // prevent row click
    setSelectedBen({ ...ben, documents: ben.documents || [] });
    setSelectedFiles([]);
    setIsViewModalOpen(false); // Close view if open
    setIsModalOpen(true);
  };

  const handleRowClick = (ben) => {
    setSelectedBen({ ...ben, documents: ben.documents || [] });
    setIsViewModalOpen(true);
  };

  const handleProgressClick = async (ben) => {
    setSelectedBen(ben);
    setNewProgress({ value: ben.progress || 0, comment: '' });
    setIsHistoryModalOpen(true);
    try {
      const res = await fetch(`http://localhost:5000/api/beneficiaries/${ben.id}/history`);
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedBen(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

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
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Error connecting to server");
    } finally {
      setIsUpdating(false);
    }
  };

  const promptDelete = (e, ben) => {
    e.stopPropagation();
    setDeletingBen(ben);
  };

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
          console.error("Server returned non-JSON error:", response.status);
          alert(`Server Error (${response.status}). Please restart the backend server.`);
        }
      }

    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      alert('Error connecting to the server.');
    } finally {
      setIsDeleting(false);
    }
  };

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
      console.error("Progress update error:", err);
      alert("Error connecting to server");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(ben =>
    ben.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ben.contact?.includes(searchTerm)
  );

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

        <div className="table-responsive">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>NAME</th><th>CONTACT</th><th>PROJECT</th><th>STATUS</th><th>DOCS</th><th>PROGRESS</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map(ben => (
                  <tr key={ben.id} onClick={() => handleRowClick(ben)} className="clickable-row">
                    <td className="font-medium" style={{ color: '#1e293b' }}>{ben.name}</td>
                    <td>{ben.contact}</td>
                    <td>{ben.project || 'Unassigned'}</td>
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
          )}
        </div>
      </div>

      {/* BENEFICIARY DETAIL MODAL (VIEW MODE) */}
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
              {/* Personal Section */}
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-group">
                  <label>Full Name</label>
                  <span>{selectedBen.name}</span>
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

              {/* Location & Status Section */}
              <div className="profile-section">
                <h3>Location & Status</h3>
                <div className="info-row">
                   <div className="info-group">
                     <label>DS Divisions</label>
                     <span>{selectedBen.district}</span>
                   </div>
                   <div className="info-group">
                     <label>DS Divisions</label>
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
              </div>

              {/* Socio-Economic Section */}
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

              {/* Documents Section */}
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

      {/* PROGRESS HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Progress History: {selectedBen.name}</h2>
            
            <form onSubmit={handleProgressSubmit} style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>New Update</h3>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Progress (%)</label>
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={newProgress.value}
                    onChange={(e) => setNewProgress({...newProgress, value: e.target.value})}
                    className="modern-input"
                    required
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Comment</label>
                  <input 
                    type="text"
                    placeholder="Brief update note..."
                    value={newProgress.comment}
                    onChange={(e) => setNewProgress({...newProgress, comment: e.target.value})}
                    className="modern-input"
                  />
                </div>
              </div>
              <button type="submit" disabled={isUpdating} className="save-btn" style={{ width: '100%' }}>
                {isUpdating ? 'Saving...' : 'Update Progress'}
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
              )}
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

      {/* FULL EDIT MODAL */}
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
              {/* SECTION: Personal Information */}
              <div style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontBold: '700', marginBottom: '15px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Full Name</label>
                    <input type="text" name="name" value={selectedBen.name} onChange={handleInputChange} className="modern-input" required />
                  </div>
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

              {/* SECTION: Location & Assignment */}
              <div style={{ marginBottom: '25px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontBold: '700', marginBottom: '15px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location & Program</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>DS Divisions</label>
                    <select name="district" value={selectedBen.district} onChange={handleInputChange} className="modern-select">
                      <option value="">Select Location</option>
                      <option value="Ambagamuwa">Ambagamuwa</option>
                      <option value="Hanguranketha">Hanguranketha</option>
                      <option value="Kothmale">Kothmale</option>
                      <option value="Nuwara Eliya">Nuwara Eliya</option>
                      <option value="Walapane">Walapane</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>DS Divisions</label>
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
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Status</label>
                    <select name="status" value={selectedBen.status} onChange={handleInputChange} className="modern-select">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: Socio-Economic Details */}
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

              {/* SECTION: Documents */}
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
      {/* Custom Delete Confirmation Modal */}
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
               Do you really want to delete <strong>{deletingBen.name}</strong>? This action cannot be undone.
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