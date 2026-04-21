// Side menu that shows all options
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/berendina-logo.png';

const Sidebar = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user name and role from the login session
  const storedUser = JSON.parse(sessionStorage.getItem('user'));
  const effectiveUser = currentUser || storedUser;
  const userRole = effectiveUser?.role || 'officer';
  const userName = effectiveUser?.firstName || effectiveUser?.first_name || 'User';
  const userId = effectiveUser?.id || effectiveUser?.user_id;

  const [isAvailable, setIsAvailable] = React.useState(true);
  const [hasNotification, setHasNotification] = React.useState(false);

  // Check if officer is available for work
  React.useEffect(() => {
    if (userRole === 'officer' && userId) {
      fetch(`http://localhost:5000/api/auth/officers/${userId}`)
        .then(res => res.json())
        .then(data => setIsAvailable(data.isAvailable !== false))
        .catch(error => { console.error('Error fetching officer status:', error); });

      fetch(`http://localhost:5000/api/auth/notifications?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          const unread = data.some(n => !n.read_status && n.message.includes('Administrator'));
          if (unread) setHasNotification(true);
        })
        .catch(error => { console.error('Error fetching notifications:', error); });
    }
  }, [userId, userRole]);

  // This makes the officer status change
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
    } catch (error) {
      console.error('Update status error:', error);
      alert('Error: Could not update status.');
    }
  };

  // List of all buttons in the menu
  const allMenuItems = [
    { id: 1, icon: '🏠', label: 'Dashboard', path: '/dashboard', roles: ['admin', 'officer'] },
    { id: 2, icon: '👥', label: 'Beneficiaries', path: '/beneficiaries', roles: ['admin', 'officer'] },
    { id: 3, icon: '📅', label: 'Field Visits', path: '/field-visits', roles: ['admin', 'officer'] },
    { id: 4, icon: '📦', label: 'Resources', path: '/resources', roles: ['admin', 'officer'] },
    { id: 5, icon: '📁', label: 'Projects', path: '/projects', roles: ['admin', 'officer'] },
    { id: 6, icon: '👮', label: 'Field Officers', path: '/field-officers', roles: ['admin'] },
    { id: 7, icon: '📋', label: 'Reports', path: '/report-generator', roles: ['admin'] },
  ];

  // Only show buttons the person is allowed to see
  const filteredMenu = allMenuItems.filter(item => item.roles.includes(userRole));

  const isActive = (item) => {
    if (item.label === 'Dashboard') {
      return location.pathname === '/admin-dashboard' || location.pathname === '/officer-dashboard';
    }
    return location.pathname === item.path;
  };

  return (
    // Sidebar layout structure
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
            <p className="user-role" style={{ textTransform: 'capitalize' }}>{userRole}</p>
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
        
        {/* Logout button */}
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