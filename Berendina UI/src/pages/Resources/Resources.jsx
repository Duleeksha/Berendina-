import React, { useState, useEffect } from 'react';
import './Resources.css';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Equipment',
    quantity: 0,
    status: 'Available',
    condition: 'Good'
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

  useEffect(() => {
    fetchResources();
  }, []);

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        type: resource.type,
        quantity: resource.quantity,
        status: resource.status,
        condition: resource.condition
      });
    } else {
      setEditingResource(null);
      setFormData({
        name: '',
        type: 'Equipment',
        quantity: 0,
        status: 'Available',
        condition: 'Good'
      });
    }
    setIsModalOpen(true);
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
                  <th>Resource Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Allocated To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(resource => (
                  <tr key={resource.id}>
                    <td className="font-medium">{resource.name}</td>
                    <td className="text-gray">{resource.type}</td>
                    <td>{resource.quantity}</td>
                    <td>
                      <span className={`status-badge ${resource.status?.toLowerCase()}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge condition-${resource.condition?.toLowerCase()}`}>
                        {resource.condition}
                      </span>
                    </td>
                    <td>{resource.allocatedTo || 'Unallocated'}</td>
                    <td>
                      <button className="action-btn-view" onClick={() => handleOpenModal(resource)}>Edit</button>
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
                <label>Type</label>
                <select 
                  className="modern-select" 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Equipment">Equipment</option>
                  <option value="Learning">Learning</option>
                  <option value="Health">Health</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
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
                <label>Status</label>
                <select 
                  className="modern-select" 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Available">Available</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Maintenance">Maintenance</option>
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
    </div>
  );
};

export default Resources;