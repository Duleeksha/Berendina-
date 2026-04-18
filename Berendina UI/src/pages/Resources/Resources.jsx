import React, { useState, useEffect } from 'react';
import './Resources.css';
import ResourceRequestModal from './ResourceRequestModal';
const Resources = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(sessionStorage.getItem('user'));
  const isAdmin = currentUser?.role === 'admin';
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inventoryFormData, setInventoryFormData] = useState({
    inventory_id: null, name: '', category: 'General', total_stock: 0, unit: 'units', image: null
  });
  const [viewingRequest, setViewingRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [processingNotes, setProcessingNotes] = useState('');
  const [isProcessingLoading, setIsProcessingLoading] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, reqRes, allocRes, benRes, projRes] = await Promise.all([
        fetch('http://localhost:5000/api/resources/inventory'),
        fetch('http://localhost:5000/api/resources/requests'),
        fetch('http://localhost:5000/api/resources/allocations'),
        fetch('http://localhost:5000/api/beneficiaries'),
        fetch('http://localhost:5000/api/projects')
      ]);
      if (invRes.ok) setInventory(await invRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
      if (allocRes.ok) setAllocations(await allocRes.json());
      if (benRes.ok) setBeneficiaries(await benRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (error) {
       alert('Unable to load resource data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleProcessRequest = (id, status) => {
    setProcessingRequest({ id, status });
    setProcessingNotes('');
  };
  const confirmProcessRequest = async () => {
    if (!processingRequest || !processingNotes.trim()) return;
    setIsProcessingLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/resources/requests/${processingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: processingRequest.status, 
          adminNotes: processingNotes 
        })
      });
      if (res.ok) {
        setProcessingRequest(null);
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed: ' + err.message);
      }
    } catch (error) {
       alert('Operation Failed: Could not process the resource request. Please try again later.');
    } finally {
      setIsProcessingLoading(false);
    }
  };
  const handleReturnResource = async (id) => {
    if (!window.confirm('Mark this resource as returned to stock?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/resources/allocations/${id}/return`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert('Item returned to stock!');
        fetchData();
      } else {
        alert('Failed to return item. Please try again.');
      }
    } catch (error) {
      alert("Error: Failed to register the returned item. Please check your connection.");
    }
  };
  const handleEditItem = (item) => {
    setInventoryFormData({
      inventory_id: item.inventory_id,
      name: item.item_name,
      category: item.category,
      total_stock: item.total_stock,
      unit: item.unit || 'units',
      image: null
    });
    setIsInventoryModalOpen(true);
  };
  const promptDeleteResource = (item) => {
    setDeletingResource(item);
  };
  const confirmDeleteResource = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    try {
      const resp = await fetch(`http://localhost:5000/api/resources/inventory/${deletingResource.inventory_id}`, { 
        method: 'DELETE' 
      });
      if (resp.ok) {
        alert('Item deleted successfully!');
        setDeletingResource(null);
        fetchData();
      } else {
        const err = await resp.json();
        alert('Delete failed: ' + (err.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error: Unable to delete the resource at this time.');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleAddInventory = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', inventoryFormData.name);
    formData.append('category', inventoryFormData.category);
    formData.append('total_stock', inventoryFormData.total_stock);
    formData.append('unit', inventoryFormData.unit);
    if (inventoryFormData.image) {
      formData.append('image', inventoryFormData.image);
    }
    const isEditing = !!inventoryFormData.inventory_id;
    const url = isEditing 
      ? `http://localhost:5000/api/resources/inventory/${inventoryFormData.inventory_id}`
      : 'http://localhost:5000/api/resources/inventory';
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method: method,
        body: formData
      });
      if (res.ok) {
        alert(isEditing ? 'Inventory item updated!' : 'Inventory item added!');
        setInventoryFormData({ name: '', category: 'General', total_stock: 0, unit: 'units', image: null });
        setIsInventoryModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed: ' + err.message);
      }
    } catch (error) {
      alert("Error: Failed to save the resource update. Please check the form and try again.");
    }
  };
  const renderInventory = () => {
    if (inventory.length === 0) {
      return (
        <div style={{textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0'}}>
          <div style={{fontSize: '48px', marginBottom: '20px'}}>📦</div>
          <h3 style={{color: '#1e293b', marginBottom: '10px'}}>Your Inventory is Empty</h3>
          <p style={{color: '#64748b', marginBottom: '25px', maxWidth: '400px', marginInline: 'auto'}}>
            It looks like there are no resources in the catalog yet. Start by adding items like water tanks, seeds, or tools.
          </p>
          {isAdmin && (
            <button className="add-project-btn" onClick={() => setIsInventoryModalOpen(true)}>
              + Add First Resource
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="inventory-grid">
        {inventory.map(item => {
          const stockPct = (item.available_stock / item.total_stock) * 100;
          const statusClass = stockPct < 10 ? 'critical' : stockPct < 30 ? 'warning' : '';
          return (
            <div key={item.inventory_id} className={`inventory-card ${stockPct < 20 ? 'low-stock' : ''}`}>
              <div className="card-header">
                <div>
                  <div className="item-name">{item.item_name}</div>
                  <div className="item-cat">{item.category}</div>
                </div>
                {stockPct < 20 && <span className="status-badge rejected">Low Stock</span>}
              </div>
              <div className="stock-info">
                <span className="stock-label">Available Stock</span>
                <span className="stock-count">{item.available_stock} / {item.total_stock} <small>{item.unit}</small></span>
              </div>
              <div className="stock-bar-bg">
                <div className={`stock-bar-fill ${statusClass}`} style={{ width: `${stockPct}%` }}></div>
              </div>
              {isAdmin ? (
                 <div className="inventory-actions">
                    <button className="action-btn-view" onClick={() => handleEditItem(item)}>Edit</button>
                    <button className="action-btn-delete" onClick={() => promptDeleteResource(item)}>Delete</button>
                 </div>
              ) : (
                 <div className="inventory-actions">
                    <button className="add-project-btn" onClick={() => setIsRequestModalOpen(true)}>Request This</button>
                 </div>
              )}
            </div>
          );
        })}
        {isAdmin && (
          <div 
            className="inventory-card add-card" 
            onClick={() => setIsInventoryModalOpen(true)}
            style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '200px', 
              border: '2px dashed #0081c9', 
              background: '#f0f9ff',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{fontSize: '40px', color: '#0081c9', marginBottom: '10px'}}>+</div>
            <div style={{fontWeight: '700', color: '#0081c9'}}>Add New Resource</div>
            <p style={{fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '5px'}}>Update your catalog</p>
          </div>
        )}
      </div>
    );
  };
  const renderRequests = () => {
    if (requests.length === 0) {
      return (
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
          <p>No resource requests found.</p>
        </div>
      );
    }
    return (
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Beneficiary</th>
              <th>Officer</th>
              <th>Items Requested</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr 
                key={req.id} 
                onClick={() => setViewingRequest(req)} 
                style={{cursor: 'pointer', transition: 'background 0.2s'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td>{new Date(req.date).toLocaleDateString()}</td>
                <td>{req.beneficiaryName}</td>
                <td>{req.officerName}</td>
                <td>
                  <div style={{fontSize: '0.85rem'}}>
                    {req.items.map((i, idx) => (
                      <div key={idx}>• {i.name} (x{i.qty})</div>
                    ))}
                  </div>
                </td>
                <td><span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span></td>
                <td onClick={(e) => e.stopPropagation()}>
                  {isAdmin && req.status === 'Pending' && (
                    <div className="action-group" style={{display: 'flex', gap: '8px'}}>
                      <button className="action-btn-view" onClick={() => handleProcessRequest(req.id, 'Approved')}>Approve</button>
                      <button className="action-btn-delete" onClick={() => handleProcessRequest(req.id, 'Rejected')}>Reject</button>
                    </div>
                  )}
                  {!isAdmin && req.status === 'Pending' && (
                    <button className="action-btn-delete" onClick={() => handleProcessRequest(req.id, 'Rejected')}>Cancel</button>
                  )}
                  {req.status !== 'Pending' && <span>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  const renderAllocations = () => {
    if (allocations.length === 0) {
      return (
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
          <p>No resource allocations found.</p>
        </div>
      );
    }
    return (
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Delivery Date</th>
              <th>Resource</th>
              <th>Beneficiary</th>
              <th>Qty</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {allocations.map(alloc => (
              <tr key={alloc.id}>
                <td>{alloc.deliveryDate}</td>
                <td className="font-medium">{alloc.resourceName}</td>
                <td>{alloc.beneficiaryName}</td>
                <td>{alloc.quantity}</td>
                <td><span className={`status-badge ${alloc.status.toLowerCase()}`}>{alloc.status}</span></td>
                {isAdmin && alloc.status === 'Allocated' && (
                  <td>
                    <button className="action-btn-view" onClick={() => handleReturnResource(alloc.id)}>Mark Returned</button>
                  </td>
                )}
                {isAdmin && alloc.status !== 'Allocated' && <td>—</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  return (
    <div className="resources-page-content">
      <div className="page-header">
        <div>
          <h1>Resource Management</h1>
          <p>{isAdmin ? 'System-wide inventory and allocation control' : 'View stock and request resources for beneficiaries'}</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
           {isAdmin && (
             <button className="add-project-btn" onClick={() => setIsInventoryModalOpen(true)}>+ Add Inventory</button>
           )}
           {!isAdmin && (
             <button className="add-project-btn" onClick={() => setIsRequestModalOpen(true)}>+ New Request</button>
           )}
        </div>
      </div>
      <div className="resource-tabs">
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory Catalog</button>
        <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          Requests {isAdmin && requests.filter(r => r.status === 'Pending').length > 0 && `(${requests.filter(r => r.status === 'Pending').length})`}
        </button>
        <button className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => setActiveTab('allocations')}>Allocation History</button>
      </div>
      <div className="content-card">
        {loading ? <div className="loading">Loading data...</div> : (
          <>
            {activeTab === 'inventory' && renderInventory()}
            {activeTab === 'requests' && renderRequests()}
            {activeTab === 'allocations' && renderAllocations()}
          </>
        )}
      </div>
      {}
      <ResourceRequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        inventory={inventory}
        beneficiaries={beneficiaries}
        projects={projects}
        currentUser={currentUser}
        onSubmitSuccess={fetchData}
      />
      {isInventoryModalOpen && (
        <div className="modal-overlay">
           <div className="modal-content">
             <h2>{inventoryFormData.inventory_id ? 'Update Resource' : 'Add to Inventory'}</h2>
             <form onSubmit={handleAddInventory}>
                <div className="form-group" style={{marginBottom: '15px'}}>
                   <label>Item Name</label>
                   <input 
                    type="text" className="modern-input" required 
                    value={inventoryFormData.name}
                    onChange={e => setInventoryFormData({...inventoryFormData, name: e.target.value})}
                   />
                </div>
                <div className="form-group" style={{marginBottom: '15px'}}>
                   <label>Category</label>
                   <select 
                    className="modern-select"
                    value={inventoryFormData.category}
                    onChange={e => setInventoryFormData({...inventoryFormData, category: e.target.value})}
                   >
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Livelihood">Livelihood</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Energy">Energy</option>
                      <option value="General">General</option>
                   </select>
                </div>
                <div className="form-group" style={{marginBottom: '15px'}}>
                   <label>Total Stock Quantity</label>
                   <input 
                    type="number" className="modern-input" required 
                    value={inventoryFormData.total_stock}
                    onChange={e => setInventoryFormData({...inventoryFormData, total_stock: e.target.value})}
                   />
                </div>
                <div className="form-group" style={{marginBottom: '15px'}}>
                   <label>Unit of Measurement (e.g., kg, pieces, units)</label>
                   <input 
                    type="text" className="modern-input" 
                    placeholder="units"
                    value={inventoryFormData.unit}
                    onChange={e => setInventoryFormData({...inventoryFormData, unit: e.target.value})}
                   />
                </div>
                <div className="form-group" style={{marginBottom: '15px'}}>
                   <label>Resource Image</label>
                   <input 
                    type="file" 
                    className="modern-input" 
                    accept="image/*"
                    onChange={e => setInventoryFormData({...inventoryFormData, image: e.target.files[0]})}
                   />
                </div>
                <div className="modal-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px'}}>
                   <button type="button" className="cancel-btn" onClick={() => setIsInventoryModalOpen(false)}>Cancel</button>
                   <button type="submit" className="save-btn">{inventoryFormData.inventory_id ? 'Update Item' : 'Add Item'}</button>
                </div>
             </form>
           </div>
        </div>
      )}
      {}
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
               Do you really want to delete <strong>{deletingResource.item_name}</strong>? This action cannot be undone.
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
                 onClick={confirmDeleteResource} 
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
      {}
      {processingRequest && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2500
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '35px', borderRadius: '15px', width: '90%', maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
               <h2 style={{margin: 0, color: '#111827', fontSize: '1.25rem'}}>
                 {processingRequest.status === 'Approved' ? 'Approve Request' : 'Reject Request'}
               </h2>
               <button 
                 onClick={() => setProcessingRequest(null)} 
                 style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af'}}
               >
                 &times;
               </button>
             </div>
             <div className="form-group" style={{marginBottom: '25px'}}>
               <label style={{display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#4b5563'}}>
                 Enter {processingRequest.status.toLowerCase()} notes:
               </label>
               <textarea 
                 className="modern-input"
                 autoFocus
                 value={processingNotes}
                 onChange={(e) => setProcessingNotes(e.target.value)}
                 placeholder={`Provide the reason for ${processingRequest.status.toLowerCase()}...`}
                 style={{width: '100%', minHeight: '120px', padding: '15px', borderRadius: '10px', border: '2px solid #e5e7eb', resize: 'none'}}
               />
               <p style={{fontSize: '12px', color: '#6b7280', marginTop: '8px'}}>Notes are mandatory to proceed.</p>
             </div>
             <div className="modal-actions" style={{display: 'flex', gap: '15px', justifyContent: 'flex-end'}}>
               <button 
                 onClick={() => setProcessingRequest(null)} 
                 className="cancel-btn"
                 disabled={isProcessingLoading}
                 style={{padding: '12px 24px', borderRadius: '10px', fontWeight: '600'}}
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmProcessRequest} 
                 className="save-btn"
                 disabled={isProcessingLoading || !processingNotes.trim()}
                 style={{
                   padding: '12px 24px', borderRadius: '10px', fontWeight: '600',
                   backgroundColor: processingRequest.status === 'Approved' ? '#0081c9' : '#ef4444'
                 }}
               >
                 {isProcessingLoading ? 'Processing...' : `Confirm ${processingRequest.status === 'Approved' ? 'Approval' : 'Rejection'}`}
               </button>
             </div>
          </div>
        </div>
      )}
      {}
      {viewingRequest && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0'
          }}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
               <h2 style={{margin: 0, color: '#0f172a', fontSize: '20px'}}>Resource Request Details</h2>
               <button onClick={() => setViewingRequest(null)} style={{background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</button>
             </div>
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
               <div style={{background: '#f8fafc', padding: '12px', borderRadius: '12px'}}>
                 <label style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block'}}>Beneficiary</label>
                 <div style={{fontWeight: 700, color: '#1e293b'}}>{viewingRequest.beneficiaryName}</div>
               </div>
               <div style={{background: '#f8fafc', padding: '12px', borderRadius: '12px'}}>
                 <label style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block'}}>Status</label>
                 <div style={{fontWeight: 700, color: viewingRequest.status === 'Approved' ? '#10b981' : (viewingRequest.status === 'Rejected' ? '#ef4444' : '#f59e0b')}}>
                   {viewingRequest.status}
                 </div>
               </div>
             </div>
             <div style={{marginBottom: '20px'}}>
               <label style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>Reason / Request Note</label>
               <div style={{
                 background: '#f0f9ff', padding: '15px', borderRadius: '12px', 
                 borderLeft: '4px solid #0081c9', color: '#0c4a6e', lineHeight: '1.5', fontSize: '15px'
               }}>
                 {viewingRequest.note || "No reason provided for this request."}
               </div>
             </div>
             <div style={{marginBottom: '25px'}}>
               <label style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block'}}>Items Requested</label>
               <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                 {viewingRequest.items.map((item, idx) => (
                   <div key={idx} style={{background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600}}>
                     📦 {item.name} <span style={{color: '#64748b', marginLeft: '5px'}}>×{item.qty}</span>
                   </div>
                 ))}
               </div>
             </div>
             <div style={{textAlign: 'right', borderTop: '1px solid #f1f5f9', paddingTop: '20px'}}>
               <button onClick={() => setViewingRequest(null)} style={{padding: '10px 25px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer'}}>Close Detail</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Resources;