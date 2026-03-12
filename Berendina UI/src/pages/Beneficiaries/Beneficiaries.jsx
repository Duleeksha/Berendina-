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
  const [selectedBen, setSelectedBen] = useState({
    name: '', nic: '', dob: '', gender: '', contact: '', 
    district: '', dsDivision: '', address: '', maritalStatus: '', 
    familyMembers: '', monthlyIncome: '', occupation: '', project: '', status: 'active'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Data Loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [benRes, projRes] = await Promise.all([
          fetch('http://localhost:5000/api/auth/beneficiaries'),
          fetch('http://localhost:5000/api/auth/projects')
        ]);
        if (benRes.ok) setBeneficiaries(await benRes.json());
        if (projRes.ok) setProjectList(await projRes.json());
      } catch (error) {
        console.error('Network error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      // Backend Update API call eka (PUT)
      const response = await fetch(`http://localhost:5000/api/auth/beneficiaries/${selectedBen.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedBen),
      });
      
      if (response.ok) {
        alert("Beneficiary profile updated successfully!");
        setIsModalOpen(false);
        // Refresh the list without page reload
        const updatedRes = await fetch('http://localhost:5000/api/auth/beneficiaries');
        if (updatedRes.ok) setBeneficiaries(await updatedRes.json());
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
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
             <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
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
                    <td className="font-medium" style={{ color: '#1e293b' }}>{ben.name}</td>
                    <td>{ben.contact}</td>
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

      {/* FULL EDIT MODAL WITH REGISTRATION FORM FIELDS */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 1000, overflowY: 'auto', padding: '40px 20px'
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '35px', borderRadius: '16px', width: '100%', maxWidth: '850px', position: 'relative'
          }}>
            <h2 style={{ marginBottom: '25px', color: '#1e293b', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Update Beneficiary Profile</h2>
            <form onSubmit={handleUpdateSubmit}>
              
              {/* Row 1: Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Full Name</label><input type="text" name="name" value={selectedBen.name} onChange={handleInputChange} className="modern-input" required /></div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>NIC Number</label><input type="text" name="nic" value={selectedBen.nic} onChange={handleInputChange} className="modern-input" /></div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Mobile Number</label><input type="text" name="contact" value={selectedBen.contact} onChange={handleInputChange} className="modern-input" required /></div>
              </div>

              {/* Row 2: Personal Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Date of Birth</label><input type="date" name="dob" value={selectedBen.dob} onChange={handleInputChange} className="modern-input" /></div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Gender</label>
                  <select name="gender" value={selectedBen.gender} onChange={handleInputChange} className="modern-select">
                    <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>District</label>
                  <select name="district" value={selectedBen.district} onChange={handleInputChange} className="modern-select">
                    <option value="">Select District</option><option value="Colombo">Colombo</option><option value="Gampaha">Gampaha</option><option value="Kalutara">Kalutara</option><option value="Kandy">Kandy</option><option value="Galle">Galle</option><option value="Matara">Matara</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Location Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>DS Division</label><input type="text" name="dsDivision" value={selectedBen.dsDivision} onChange={handleInputChange} className="modern-input" placeholder="Ex: Mahara" /></div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Residential Address</label><input type="text" name="address" value={selectedBen.address} onChange={handleInputChange} className="modern-input" placeholder="House No, Street, City" /></div>
              </div>

              {/* Row 4: Socio-Economic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Marital Status</label>
                  <select name="maritalStatus" value={selectedBen.maritalStatus} onChange={handleInputChange} className="modern-select">
                    <option value="">Select Status</option><option value="Single">Single</option><option value="Married">Married</option><option value="Widowed">Widowed</option><option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Family Members</label><input type="number" name="familyMembers" value={selectedBen.familyMembers} onChange={handleInputChange} className="modern-input" /></div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Monthly Income</label><input type="number" name="monthlyIncome" value={selectedBen.monthlyIncome} onChange={handleInputChange} className="modern-input" /></div>
              </div>

              {/* Row 5: Occupation & Assignment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Occupation</label><input type="text" name="occupation" value={selectedBen.occupation} onChange={handleInputChange} className="modern-input" /></div>
                <div>
                  <label style={{fontSize: '0.85rem', fontWeight: '600'}}>Assigned Project</label>
                  <select name="project" value={selectedBen.project} onChange={handleInputChange} className="modern-select" style={{ border: '1px solid #3b82f6' }}>
                    <option value="">Select Project</option>
                    {projectList.map(proj => <option key={proj.id} value={proj.name}>{proj.name}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize: '0.85rem', fontWeight: '600'}}>Current Status</label>
                  <select name="status" value={selectedBen.status} onChange={handleInputChange} className="modern-select">
                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 35px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isUpdating} style={{ padding: '12px 35px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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