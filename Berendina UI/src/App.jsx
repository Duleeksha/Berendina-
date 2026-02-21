import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';
import './theme.css';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboards
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import OfficerDashboard from './pages/Dashboard/OfficerDashboard';

// Other Pages
import Beneficiaries from './pages/Beneficiaries/Beneficiaries';
import BeneficiaryForm from './pages/Beneficiaries/BeneficiaryForm';
import FieldVisits from './pages/FieldVisits/FieldVisits';
import Resources from './pages/Resources/Resources';
import FieldOfficers from './pages/Fieldofficers/FieldOfficers';
import ReportGenerator from './pages/ReportGenerator/ReportGenerator';

// Components
import Sidebar from './components/Sidebar/Sidebar';

// --- projects ---
import Projects from './pages/Projects/Projects';

// project form
import ProjectForm from './pages/Projects/ProjectForm';

// Layout Component
const DashboardLayout = ({ handleLogout, currentUser }) => {
  if (!currentUser) {
     return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} currentUser={currentUser} />
      <main style={{ flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- FIXED USE EFFECT ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    // Check if storedUser exists AND is not the string "undefined"
    if (storedUser && storedUser !== "undefined") {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('user'); // Clean up corrupt data
      }
    } else {
      // If it is "undefined" or null, clean it up
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout handleLogout={handleLogout} currentUser={currentUser} />}>
          
          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          
          {/* Officer Dashboard */}
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
          
          {/* Common Pages */}
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/beneficiary-form" element={<BeneficiaryForm />} />
          <Route path="/beneficiary-form/:id" element={<BeneficiaryForm />} />
          <Route path="/field-visits" element={<FieldVisits />} />
          <Route path="/resources" element={<Resources />} />
          
          {/* NEW ROUTE: Field Officers (Admin Only) */}
          <Route path="/field-officers" element={<FieldOfficers />} />
          
          {/* Admin Only Route */}
          <Route path="/report-generator" element={<ReportGenerator />} />
          
          {/* --- REDIRECT LOGIC --- */}
          <Route path="/dashboard" element={
             currentUser ? (
                currentUser.role === 'admin' ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/officer-dashboard" replace />
             ) : (
                <Navigate to="/login" replace />
             )
          } />

          <Route path="/" element={
             currentUser ? (
                currentUser.role === 'admin' ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/officer-dashboard" replace />
             ) : (
                <Navigate to="/login" replace />
             )
          } />

{/* --- NEW ROUTE: Projects --- */}
          <Route path="/projects" element={<Projects />} />

<Route path="/project-form" element={<ProjectForm />} />


          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;