import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Projects.css';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // <-- MEKA ALUTHIN ADD KALA
  
  // Dummy Data ain karala his array ekak danawa
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend eken data ganna useEffect eka
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Network error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.donor && project.donor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editData, setEditData] = useState({});
  const [projectBeneficiaries, setProjectBeneficiaries] = useState([]);
  const [fetchingBen, setFetchingBen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProjectBeneficiaries = async (projectName) => {
    setFetchingBen(true);
    try {
      const response = await fetch('http://localhost:5000/api/beneficiaries');
      if (response.ok) {
        const data = await response.json();
        // Filter by project name
        const filtered = data.filter(b => b.project === projectName);
        setProjectBeneficiaries(filtered);
      }
    } catch (error) {
      console.error('Error fetching project beneficiaries:', error);
    } finally {
      setFetchingBen(false);
    }
  };

  const handleOpenView = (project) => {
    setSelectedProject(project);
    setEditData({ ...project });
    setIsEditMode(false);
    fetchProjectBeneficiaries(project.name);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project, e) => {
    if (e) e.stopPropagation();
    setSelectedProject(project);
    setEditData({ ...project });
    setIsEditMode(true);
    fetchProjectBeneficiaries(project.name);
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        const updated = await response.json();
        
        // Use functional state update and ensure ID comparison handles type mismatch
        setProjects(prevProjects => 
          prevProjects.map(p => String(p.id) === String(updated.id) ? { ...p, ...updated } : p)
        );
        
        alert('Project updated successfully!');
        setIsModalOpen(false); 
        setIsEditMode(false);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unexpected error' }));
        alert(`Error: ${errorData.message || response.statusText}`);
      }

    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating project');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="officers-page-content">
      
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Projects & Programs</h1>
          <p>Manage all NGO projects, budgets, and timelines.</p>
        </div>
        <button className="add-project-btn" onClick={() => navigate('/project-form')}>
          + Add New Project
        </button>
      </div>

      {/* Main Content Card */}
      <div className="content-card">
        
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
                type="text"
                placeholder="Search projects by name or donor..."
                className="modern-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading projects...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Donor Agency</th>
                  <th>Location</th>
                  <th>Duration</th>
                  <th>Budget (Rs.)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map(project => (
                    <tr key={project.id} onClick={() => handleOpenView(project)} style={{ cursor: 'pointer' }}>
                      <td className="font-medium" style={{ color: '#1e293b' }}>{project.name}</td>
                      <td className="text-gray">{project.donor || 'N/A'}</td>
                      <td>{project.location || 'N/A'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{project.start} <br/>to {project.end}</td>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{project.budget}</td>
                      <td>
                        <span className={`status-badge ${project.status ? project.status.toLowerCase() : 'pending'}`}>
                          {project.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn-view" onClick={(e) => handleOpenEdit(project, e)}>Edit</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>
                      No projects found. Try adding a new project!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      {isModalOpen && selectedProject && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '800px',
            maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>{isEditMode ? 'Edit Project' : selectedProject.name}</h2>
              <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} className="cancel-btn">Close</button>
            </div>
            
            {!isEditMode ? (
              <>
                <div style={{marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div><strong>Donor:</strong> {selectedProject.donor}</div>
                  <div><strong>Budget:</strong> Rs. {selectedProject.budget}</div>
                  <div><strong>Location:</strong> {selectedProject.location}</div>
                  <div><strong>Status:</strong> {selectedProject.status}</div>
                  <div><strong>Start Date:</strong> {selectedProject.start}</div>
                  <div><strong>End Date:</strong> {selectedProject.end}</div>
                  <div style={{gridColumn: 'span 2'}}><strong>Description:</strong> {selectedProject.description || 'No description provided.'}</div>
                </div>

                <div style={{marginBottom: '20px', textAlign: 'right'}}>
                  <button className="add-project-btn" onClick={() => setIsEditMode(true)}>Edit Details</button>
                </div>

                <hr />
                
                <h3>Beneficiaries ({projectBeneficiaries.length})</h3>
                {fetchingBen ? <p>Loading beneficiaries...</p> : (
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>NIC</th>
                        <th>Status</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectBeneficiaries.length > 0 ? projectBeneficiaries.map(ben => (
                        <tr key={ben.id}>
                          <td>{ben.name}</td>
                          <td>{ben.nic}</td>
                          <td><span className={`status-badge ${ben.status?.toLowerCase()}`}>{ben.status}</span></td>
                          <td>{ben.progress}%</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" style={{textAlign: 'center'}}>No beneficiaries assigned yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
                
                <div style={{marginTop: '20px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                  <button className="add-project-btn" onClick={() => navigate(`/beneficiary-form?project=${selectedProject.name}`)}>
                    + Assign New Beneficiary
                  </button>
                </div>
              </>
            ) : (
              <div className="edit-project-form" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                 <div className="input-group">
                   <label>Project Name</label>
                   <input className="modern-input" name="name" value={editData.name} onChange={handleEditChange} />
                 </div>
                 <div className="input-group">
                   <label>Donor Agency</label>
                   <select 
                     className="modern-input" 
                     value={!editData.donor ? "" : (["World Vision", "Save the Children", "The Asia Foundation", "Helvetas", "USAID", "Department of foreign affairs and trade", "Asian development bank"].includes(editData.donor) ? editData.donor : "Other")}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (val === "Other") {
                         setEditData({ ...editData, donor: "" });
                       } else {
                         setEditData({ ...editData, donor: val });
                       }
                     }}
                   >
                     <option value="">Select Donor Agency</option>
                     <option value="World Vision">World Vision</option>
                     <option value="Save the Children">Save the Children</option>
                     <option value="The Asia Foundation">The Asia Foundation</option>
                     <option value="Helvetas">Helvetas</option>
                     <option value="USAID">USAID</option>
                     <option value="Department of foreign affairs and trade">Department of foreign affairs and trade</option>
                     <option value="Asian development bank">Asian development bank</option>
                     <option value="Other">Other</option>
                   </select>
                   {(!["World Vision", "Save the Children", "The Asia Foundation", "Helvetas", "USAID", "Department of foreign affairs and trade", "Asian development bank", ""].includes(editData.donor) || (editData.donor === "" && document.querySelector('select[value="Other"]'))) && (
                     <input 
                       className="modern-input" 
                       name="donor" 
                       placeholder="Enter custom donor agency" 
                       value={editData.donor} 
                       onChange={handleEditChange} 
                       style={{marginTop: '10px'}}
                     />
                   )}
                 </div>
                 <div className="input-group">
                   <label>Location</label>
                   <select 
                     className="modern-input" 
                     name="location"
                     value={editData.location} 
                     onChange={handleEditChange}
                   >
                     <option value="">Select Location</option>
                     {["Ambagamuwa", "Hanguranketha", "Kothmale", "Nuwara Eliya", "Walapane"].map(loc => (
                       <option key={loc} value={loc}>{loc}</option>
                     ))}
                   </select>
                 </div>
                 <div className="input-group">
                   <label>Budget (Rs.)</label>
                   <input className="modern-input" name="budget" value={editData.budget} onChange={handleEditChange} />
                 </div>
                 <div className="input-group">
                   <label>Start Date</label>
                   <input type="date" className="modern-input" name="start" value={editData.start ? editData.start.split('T')[0] : ''} onChange={handleEditChange} />
                 </div>
                 <div className="input-group">
                   <label>End Date</label>
                   <input type="date" className="modern-input" name="end" value={editData.end ? editData.end.split('T')[0] : ''} onChange={handleEditChange} />
                 </div>
                 <div className="input-group">
                    <label>Status</label>
                    <select className="modern-input" name="status" value={editData.status} onChange={handleEditChange}>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                 </div>
                 <div className="input-group" style={{gridColumn: 'span 2'}}>
                   <label>Description</label>
                   <textarea className="modern-input" name="description" value={editData.description} onChange={handleEditChange} style={{minHeight: '100px'}} />
                 </div>
                 <div style={{gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px'}}>
                   <button className="cancel-btn" onClick={() => setIsEditMode(false)}>Cancel</button>
                   <button className="add-project-btn" onClick={handleUpdateSubmit} disabled={isUpdating}>
                     {isUpdating ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;