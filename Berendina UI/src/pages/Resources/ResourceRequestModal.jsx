import React, { useState, useEffect } from 'react';
import './Resources.css';

const ResourceRequestModal = ({ isOpen, onClose, inventory, beneficiaries, projects, currentUser, onSubmitSuccess }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestItems, setRequestItems] = useState([]); // [{ inventoryId, quantity, name }]
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived: Filter beneficiaries based on selected project
  const filteredBeneficiaries = beneficiaries.filter(b => b.project === selectedProject);

  // Derived: Searchable inventory (Show items even with 0 stock so user knows they exist)
  const filteredInventory = inventory.filter(i => {
    const itemName = (i.item_name || i.name || '').toLowerCase();
    return itemName.includes(inventorySearchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  const handleProjectChange = (val) => {
    setSelectedProject(val);
    setSelectedBeneficiary(''); // Reset beneficiary when project changes
  };

  const addItemToBatch = (item) => {
    const existing = requestItems.find(i => i.inventoryId === item.inventory_id);
    if (existing) {
      // If item already exists, increment quantity up to available stock
      if (existing.quantity < existing.available) {
        updateQuantity(item.inventory_id, existing.quantity + 1);
      } else {
        alert(`${item.item_name || item.name}: Maximum available stock reached.`);
      }
      return;
    }

    setRequestItems([...requestItems, { 
      inventoryId: item.inventory_id, 
      quantity: 1, 
      name: item.item_name || item.name,
      available: item.available_stock || 0
    }]);
  };

  const removeItemFromBatch = (id) => {
    setRequestItems(requestItems.filter(i => i.inventoryId !== id));
  };

  const updateQuantity = (id, qty) => {
    setRequestItems(requestItems.map(i => 
      i.inventoryId === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.available)) } : i
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requestItems.length === 0) return alert('Please add at least one item');
    
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/resources/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: selectedBeneficiary,
          officerId: currentUser?.id,
          projectName: selectedProject,
          note: requestNote,
          items: requestItems.map(i => ({ inventoryId: i.inventoryId, quantity: i.quantity }))
        }),
      });

      if (response.ok) {
        alert('Request submitted successfully!');
        // Reset state
        setSelectedProject('');
        setSelectedBeneficiary('');
        setRequestItems([]);
        setRequestNote('');
        setInventorySearchTerm('');
        
        onSubmitSuccess();
        onClose();
      } else {
        const err = await response.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      alert('Internal Server Error: Could not submit the resource request. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content batch-request-modal">
        <div className="modal-header">
          <h2>Request Resources</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '20px', marginBottom: '20px'}}>
            <div className="form-group">
              <label>1. Select Project Context</label>
              <select 
                className="modern-select" 
                value={selectedProject} 
                onChange={(e) => handleProjectChange(e.target.value)}
                required
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>2. Target Beneficiary</label>
              <select 
                className="modern-select" 
                value={selectedBeneficiary} 
                onChange={(e) => setSelectedBeneficiary(e.target.value)}
                required
                disabled={!selectedProject}
              >
                <option value="">{selectedProject ? 'Select Recipient' : 'Select Project First'}</option>
                {filteredBeneficiaries.map(ben => (
                  <option key={ben.id} value={ben.id}>{ben.name} ({ben.nic})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="batch-selection-area" style={{background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
            <label style={{fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'block'}}>3. Add Items to Request</label>
            <input 
              type="text" 
              placeholder="🔍 Search inventory items to add..." 
              className="modern-input"
              style={{
                marginBottom: '15px', 
                background: 'white', 
                border: '2px solid #0081c9', 
                padding: '12px 15px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0, 129, 201, 0.05)',
                fontSize: '15px'
              }}
              value={inventorySearchTerm}
              onChange={(e) => setInventorySearchTerm(e.target.value)}
            />
            
            <div className="inventory-picker" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto'}}>
               {filteredInventory.length === 0 ? (
                 <div style={{width: '100%', textAlign: 'center', padding: '10px'}}>
                   <p style={{fontSize: '13px', color: '#475569', marginBottom: '10px', fontWeight: '500'}}>No matching inventory items found.</p>
                   {currentUser?.role === 'admin' && (
                     <button 
                       type="button" 
                       onClick={() => { onClose(); /* We should have a way to open the other modal, but for now just tell them to use the catalog */ alert('Please use the "+ Add Inventory" button in the Catalog tab to add new items.'); }}
                       style={{fontSize: '11px', color: '#0081c9', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer'}}
                     >
                       + Add New Item to Catalog
                     </button>
                   )}
                 </div>
               ) : (
                  filteredInventory.map(item => {
                    const isOutOfStock = (item.available_stock || 0) <= 0;
                    const isAlreadySelected = requestItems.some(ri => ri.inventoryId === item.inventory_id);
                    
                    return (
                      <button 
                       type="button" 
                       key={item.inventory_id} 
                       disabled={isOutOfStock}
                       className={`picker-chip ${isAlreadySelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                       onClick={() => addItemToBatch(item)}
                       title={isOutOfStock ? 'This item is currently out of stock' : ''}
                      >
                        {item.item_name || item.name} {isOutOfStock ? '(Out of Stock)' : `(${item.available_stock})`}
                      </button>
                    );
                  })
               )}
            </div>
          </div>

          <div className="selected-items-list" style={{marginTop: '20px'}}>
            <h3 style={{fontSize: '14px', marginBottom: '10px'}}>Selected Items List</h3>
            {requestItems.length === 0 ? (
              <p className="empty-hint" style={{textAlign: 'center', padding: '20px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b'}}>No items selected yet. Click on inventory items above to add them.</p>
            ) : (
              requestItems.map(item => (
                <div key={item.inventoryId} className="request-item-row" style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  padding: '12px 15px', 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  marginBottom: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <span className="item-name" style={{fontWeight: '700', flex: 1, color: '#1e293b'}}>{item.name}</span>
                  
                  <div className="item-qty-control" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <label style={{fontSize: '12px', fontWeight: '600', color: '#64748b'}}>Quantity:</label>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateQuantity(item.inventoryId, parseInt(e.target.value))}
                      max={item.available}
                      min="1"
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    className="remove-item-btn" 
                    onClick={() => removeItemFromBatch(item.inventoryId)} 
                    style={{
                      color: '#ef4444', 
                      border: 'none', 
                      background: '#fee2e2', 
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer', 
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="form-group" style={{marginTop: '20px'}}>
            <label>4. Request Note (Reason)</label>
            <textarea 
              className="modern-input" 
              value={requestNote} 
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Explain why these resources are needed for this beneficiary..."
              rows="3"
            ></textarea>
          </div>

          <div className="modal-actions" style={{marginTop: '25px', borderTop: '1px solid #e2e8f0', paddingTop: '20px'}}>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="save-btn" 
              disabled={isSubmitting || requestItems.length === 0 || !selectedBeneficiary || !selectedProject}
            >
              {isSubmitting ? 'Submitting Batch...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceRequestModal;
