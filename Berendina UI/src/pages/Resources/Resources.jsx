import React, { useState, useEffect } from 'react';
import './Resources.css';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Deletion states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    condition: 'Good',
    project: '',
    issuingDate: '',
    allocatedToId: ''
  });

  const fetchResources = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/beneficiaries');
      if (response.ok) {
        const data = await response.json();
        setBeneficiaries(data);
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
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
    fetchResources();
    fetchBeneficiaries();
    fetchProjects();
  }, []);

  // Update filtered beneficiaries when project changes
  useEffect(() => {
    if (formData.project) {
      const filtered = beneficiaries.filter(ben => 
        ben.project?.toLowerCase() === formData.project.toLowerCase()
      );
      setFilteredBeneficiaries(filtered);
    } else {
      setFilteredBeneficiaries([]);
    }
  }, [formData.project, beneficiaries]);

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        quantity: resource.quantity,
        condition: resource.condition,
        project: resource.project || '',
        issuingDate: resource.issuingDate || '',
        allocatedToId: resource.allocatedToId || ''
      });
    } else {
      setEditingResource(null);
      setFormData({
        name: '',
        quantity: 0,
        condition: 'Good',
        project: '',
        issuingDate: '',
        allocatedToId: ''
      });
    }
    setIsModalOpen(true);
  };

  const promptDelete = (resource) => {
    setDeletingResource(resource);
  };

  const confirmDelete = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/resources/${deletingResource.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Resource deleted successfully!');
        setDeletingResource(null);
        fetchResources();
      } else {
        const errorData = await response.json();
        alert('Failed to delete: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Error connecting to the server for deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingResource 
      ? `http://localhost:5000/api/resources/${editingResource.id}`
      : 'http://localhost:5000/api/resources';
    
    const method = editingResource ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert(`Resource ${editingResource ? 'updated' : 'added'} successfully!`);
        setIsModalOpen(false);
        fetchResources();
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  const filteredResources = resources.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapacity = resources.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);
  const damagedCount = resources.filter(r => r.condition === 'Damaged').length;
  const avgUtilization = resources.length > 0 ? Math.round((resources.filter(r => r.status === 'Allocated').length / resources.length) * 100) : 0;

  return (
    <div className="resources-page-content">
      <div className="page-header">
        <div>
          <h1>Resources</h1>
          <p>Manage and track all organizational resources</p>
        </div>
        <button className="add-project-btn" onClick={() => handleOpenModal()}>+ Add Resource</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Stock</div>
          <div className="stat-value">{totalCapacity}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Damaged Items</div>
          <div className="stat-value" style={{color: '#ef4444'}}>{damagedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Allocation Rate</div>
          <div className="stat-value">{avgUtilization}%</div>
        </div>
      </div>

      <div className="content-card">
        <div className="search-section">
          <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
                type="text"
                placeholder="Search resources..."
                className="modern-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="loading">Loading assets...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Qty</th>
                  <th>Condition</th>
                  <th>Project</th>
                  <th>Beneficiary</th>
                  <th>Issued Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(resource => (
                   <tr key={resource.id}>
                    <td className="font-medium">{resource.name}</td>
                    <td>{resource.quantity}</td>
                    <td>
                      <span className={`status-badge condition-${resource.condition?.toLowerCase()}`}>
                        {resource.condition}
                      </span>
                    </td>
                    <td>{resource.project || '—'}</td>
                    <td>{resource.allocatedToName || '—'}</td>
                    <td>{resource.issuingDate || '—'}</td>
                    <td>
                      <div className="action-group" style={{display: 'flex', gap: '8px'}}>
                        <button className="action-btn-view" onClick={() => handleOpenModal(resource)}>Edit</button>
                        <button className="action-btn-delete" onClick={() => promptDelete(resource)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px'
          }}>
            <h2>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Resource Name</label>
                <input 
                  type="text" 
                  className="modern-input" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Quantity</label>
                <input 
                  type="number" 
                  className="modern-input" 
                  value={formData.quantity} 
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Issuing Date</label>
                <input 
                  type="date" 
                  className="modern-input" 
                  value={formData.issuingDate} 
                  onChange={(e) => setFormData({...formData, issuingDate: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Maintained Under Project</label>
                <select 
                  className="modern-select" 
                  value={formData.project} 
                  onChange={(e) => setFormData({...formData, project: e.target.value, allocatedToId: ''})} // Reset beneficiary if project changes
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.name}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Allocate To Beneficiary</label>
                <select 
                  className="modern-select" 
                  value={formData.allocatedToId} 
                  onChange={(e) => setFormData({...formData, allocatedToId: e.target.value})}
                  disabled={!formData.project}
                >
                  <option value="">{formData.project ? 'Select Beneficiary' : 'Select Project First'}</option>
                  {filteredBeneficiaries.map(ben => (
                    <option key={ben.id} value={ben.id}>{ben.name} ({ben.nic})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{marginBottom: '25px'}}>
                <label>Condition</label>
                <select 
                  className="modern-select" 
                  value={formData.condition} 
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Replace">Needs Replacement</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deletingResource && (
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
               Do you really want to delete <strong>{deletingResource.name}</strong>? This action cannot be undone.
             </p>
             <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
               <button 
                 onClick={() => setDeletingResource(null)} 
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

export default Resources;