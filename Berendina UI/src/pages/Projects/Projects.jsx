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
        const response = await fetch('http://localhost:5000/api/auth/projects');
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

  return (
    <div className="officers-page-content">
      
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Projects & Programs</h1>
          <p>Manage all NGO projects, budgets, and timelines.</p>
        </div>
        {/* BUTTON EKATA ONCLICK EKA ADD KALA */}
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
                    <tr key={project.id}>
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
                        <button className="action-btn-view">View / Edit</button>
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
    </div>
  );
};

export default Projects;