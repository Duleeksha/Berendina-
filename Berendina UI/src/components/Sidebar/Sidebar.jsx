import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/berendina-logo.png'; 

const Sidebar = ({ currentUser }) => { 
  const navigate = useNavigate();
  const location = useLocation();

  // User Role eka gannawa (default to 'officer' if not found)
  const userRole = currentUser?.role || 'officer';
  const userName = currentUser?.firstName || 'User';

  // --- MEKA THAMA ALUTH UPDATE EKA (LOGOUT LOGIC) ---
  const handleLogout = () => {
    // 1. Browser eke save wela thiyana Data makana eka
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Login page ekata redirect karana eka
    navigate('/'); 
    
    // Optional: Page eka refresh karanawa (auth state clear karanna)
    window.location.reload();
  };
  // --------------------------------------------------

  // Menu Items Define Karanawa
  const allMenuItems = [
    { 
      id: 1, 
      icon: '🏠', 
      label: 'Dashboard', 
      path: userRole === 'admin' ? '/admin-dashboard' : '/officer-dashboard',
      roles: ['admin', 'officer'] 
    },
    { 
      id: 2, 
      icon: '👥', 
      label: 'Beneficiaries', 
      path: '/beneficiaries',
      roles: ['admin', 'officer'] 
    },
    { 
      id: 3, 
      icon: '📅', 
      label: 'Field Visits', 
      path: '/field-visits',
      roles: ['admin', 'officer'] 
    },
    { 
      id: 4, 
      icon: '📦', 
      label: 'Resources', 
      path: '/resources',
      roles: ['admin', 'officer'] 
    },
    { 
      id: 5, 
      icon: '📋', 
      label: 'Reports', 
      path: '/report-generator',
      roles: ['admin'] 
    },
  ];

  // Role eka anuwa filter karanawa
  const filteredMenu = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Berendina Logo" className="sidebar-logo" />
        <div className="brand-info">
          <h2 className="brand-name">Berendina</h2>
          <p className="brand-sub">Development Services</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredMenu.map(item => (
          <button
            key={item.id}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-role" style={{textTransform: 'capitalize'}}>{userRole}</p>
          </div>
        </div>
        
        {/* --- UPDATE KARAPU BUTTON EKA --- */}
        <button 
            className="logout-btn" 
            onClick={handleLogout} 
            title="Logout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;