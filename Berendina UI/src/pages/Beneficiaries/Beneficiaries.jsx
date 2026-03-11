import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Beneficiaries.css';

const Beneficiaries = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Project List State (Real projects tika fetch karanna) ---
  const [projectList, setProjectList] = useState([]);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBen, setSelectedBen] = useState({
    name: '', nic: '', dob: '', gender: '',
    contact: '', district: '', dsDivision: '', address: '',
    maritalStatus: '', familyMembers: '', monthlyIncome: '', occupation: '',
    project: '', status: 'active'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Beneficiaries
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/beneficiaries');
        if (response.ok) {
          const data = await response.json();
          setBeneficiaries(data);
        }
      } catch (error) {
        console.error('Network error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBeneficiaries();
  }, []);

  // 2. --- NEW: Fetch Projects for Dropdown ---
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/projects');
        if (response.ok) {
          const data = await response.json();
          setProjectList(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  const handleEditClick = (ben) => {
    setSelectedBen({ ...ben }); 
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedBen(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      console.log("Updating Beneficiary:", selectedBen);
      alert("Beneficiary profile updated successfully!");
      setIsModalOpen(false);
    } catch (error) {
      alert("Error updating beneficiary");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(ben =>
    ben.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ben.contact?.includes(searchTerm)
  );

  return (
    <div className="officers-page-content">
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
             <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading beneficiaries...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>NAME</th><th>CONTACT</th><th>PROJECT</th><th>STATUS</th><th>PROGRESS</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map(ben => (
                  <tr key={ben.id}>
                    <td>{ben.name}</td>
                    <td>{ben.contact}</td>
                    {/* --- FIXED: Project name eka display karanna --- */}
                    <td>{ben.project || 'Unassigned'}</td>
                    <td><span className={`status-badge ${ben.status?.toLowerCase()}`}>{ben.status}</span></td>
                    <td>{ben.progress}%</td>
                    <td>
                      <button className="action-btn-view" onClick={() => handleEditClick(ben)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- UPDATED FULL MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 1000, overflowY: 'auto', padding: '40px 20px'
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '35px', borderRadius: '16px', width: '100%', maxWidth: '850px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative', marginBottom: '40px'
          }}>
            <h2 style={{ marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', color: '#1e293b' }}>
              Update Beneficiary Profile
            </h2>
            
            <form onSubmit={handleUpdateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" name="name" value={selectedBen.name} onChange={handleInputChange} className="modern-input" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>NIC Number</label>
                  <input type="text" name="nic" value={selectedBen.nic} onChange={handleInputChange} className="modern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Mobile Number</label>
                  <input type="text" name="contact" value={selectedBen.contact} onChange={handleInputChange} className="modern-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>District</label>
                  <select name="district" value={selectedBen.district} onChange={handleInputChange} className="modern-input">
                    <option value="Colombo">Colombo</option><option value="Gampaha">Gampaha</option><option value="Kalutara">Kalutara</option><option value="Kandy">Kandy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>DS Division</label>
                  <input type="text" name="dsDivision" value={selectedBen.dsDivision} onChange={handleInputChange} className="modern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Gender</label>
                  <select name="gender" value={selectedBen.gender} onChange={handleInputChange} className="modern-input">
                    <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Residential Address</label>
                <input type="text" name="address" value={selectedBen.address} onChange={handleInputChange} className="modern-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Assigned Project</label>
                  {/* --- FIXED: Dynamic Dropdown using Project Tab Data --- */}
                  <select name="project" value={selectedBen.project} onChange={handleInputChange} className="modern-input" style={{ border: '1px solid #3b82f6' }}>
                    <option value="">Select Project</option>
                    {projectList.map((proj) => (
                      <option key={proj.id} value={proj.name}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Current Status</label>
                  <select name="status" value={selectedBen.status} onChange={handleInputChange} className="modern-input">
                    <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Monthly Income</label>
                  <input type="number" name="monthlyIncome" value={selectedBen.monthlyIncome} onChange={handleInputChange} className="modern-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Marital Status</label>
                  <select name="maritalStatus" value={selectedBen.maritalStatus} onChange={handleInputChange} className="modern-input">
                    <option value="Single">Single</option><option value="Married">Married</option><option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Family Members</label>
                  <input type="number" name="familyMembers" value={selectedBen.familyMembers} onChange={handleInputChange} className="modern-input" />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px', borderTop: '2px solid #f1f5f9', paddingTop: '25px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ padding: '12px 30px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  style={{ padding: '12px 30px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                >
                  {isUpdating ? "Saving..." : "Update Beneficiary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beneficiaries;