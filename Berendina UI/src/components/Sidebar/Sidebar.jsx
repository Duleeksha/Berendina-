import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/berendina-logo.png'; 

const Sidebar = ({ currentUser, onLogout }) => { 
  const navigate = useNavigate();
  const location = useLocation();

  // --- FIX START ---
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const effectiveUser = currentUser || storedUser;
  // --- FIX END ---

  const userRole = effectiveUser?.role || 'officer';
  const userName = effectiveUser?.firstName || 'User';
  const userId = effectiveUser?.id;

  const [isAvailable, setIsAvailable] = React.useState(true);
  const [hasNotification, setHasNotification] = React.useState(false);

  React.useEffect(() => {
    if (userRole === 'officer' && userId) {
      // Fetch initial availability
      fetch(`http://localhost:5000/api/auth/officers/${userId}`)
        .then(res => res.json())
        .then(data => setIsAvailable(data.isAvailable !== false))
        .catch(err => console.error('Fetch availability error:', err));

      // Fetch notifications to check for admin updates
      fetch(`http://localhost:5000/api/auth/notifications?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          const unread = data.some(n => !n.read_status && n.message.includes('Administrator'));
          if (unread) setHasNotification(true);
        })
        .catch(err => console.error('Fetch notifications error:', err));
    }
  }, [userId, userRole]);

  const toggleStatus = async () => {
    if (!userId) return;
    const nextStatus = !isAvailable;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/officers/${userId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextStatus, updatedByRole: 'officer' })
      });
      if (res.ok) {
        setIsAvailable(nextStatus);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Menu Items Define Karanawa
  // Menu Items Define Karanawa
  const allMenuItems = [
    { 
      id: 1, 
      icon: '🏠', 
      label: 'Dashboard', 
      path: '/dashboard',
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
    // --- NEW TAB: Projects ---
    { 
      id: 5, 
      icon: '📁', 
      label: 'Projects', 
      path: '/projects',
      roles: ['admin', 'officer'] // Admin ta saha Officer ta dennama penawa
    },
    { 
      id: 6, 
      icon: '👮', 
      label: 'Field Officers', 
      path: '/field-officers', 
      roles: ['admin'] // Penne Adminlata witharai
    },
    { 
      id: 7, // ID eka 6 sita 7 kala
      icon: '📋', 
      label: 'Reports', 
      path: '/report-generator',
      roles: ['admin'] // Reports penne Admin ta witharai
    },
  ];

  // Role eka anuwa filter karanawa
  const filteredMenu = allMenuItems.filter(item => item.roles.includes(userRole));

  // Active Button eka hoyana function eka
  const isActive = (item) => {
    if (item.label === 'Dashboard') {
        return location.pathname === '/admin-dashboard' || location.pathname === '/officer-dashboard';
    }
    return location.pathname === item.path;
  };

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
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
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
          {userRole === 'officer' && (
            <div className="status-toggle-container" style={{ marginLeft: 'auto' }}>
              <button 
                onClick={toggleStatus}
                className={`status-dot-btn ${isAvailable ? 'active' : 'inactive'}`}
                title={`Status: ${isAvailable ? 'Active' : 'Unavailable'}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isAvailable ? '#10b981' : '#64748b',
                  border: '2px solid white',
                  boxShadow: '0 0 0 1px #e2e8f0'
                }}></div>
                {hasNotification && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '1px solid white'
                  }}></div>
                )}
              </button>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
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