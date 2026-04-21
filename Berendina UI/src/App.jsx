// Main file that controls where we go in app
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';
import './theme.css';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import OfficerDashboard from './pages/Dashboard/OfficerDashboard';
import Beneficiaries from './pages/Beneficiaries/Beneficiaries';
import BeneficiaryForm from './pages/Beneficiaries/BeneficiaryForm';
import FieldVisits from './pages/FieldVisits/FieldVisits';
import Resources from './pages/Resources/Resources';
import FieldOfficers from './pages/Fieldofficers/FieldOfficers';
import ReportGenerator from './pages/ReportGenerator/ReportGenerator';
import BeneficiaryLogin from './pages/Auth/BeneficiaryLogin';
import BeneficiaryPortal from './pages/Beneficiaries/BeneficiaryPortal';
import Sidebar from './components/Sidebar/Sidebar';
import Projects from './pages/Projects/Projects';
import ProjectForm from './pages/Projects/ProjectForm';
// This part set up the screen layout with sidebar
const DashboardLayout = ({ handleLogout, currentUser }) => {
  if (!currentUser) {
     return <Navigate to="/login" replace />;
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar onLogout={handleLogout} currentUser={currentUser} />
      <main style={{ flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};
function App() {
  // here we remember who is using the app
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error("Error parsing session storage user:", error);
        sessionStorage.removeItem('user');
      }
    }
  return null;
});
useEffect(() => {
}, []);
  // Help user login and save their info
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };
  // Make user info go away when they logout
  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('user');
  };
  return (
    <Router>
      {/* list of all roads */}
      <Routes>
        {}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/beneficiary-login" element={<BeneficiaryLogin />} />
        <Route path="/beneficiary-portal" element={<BeneficiaryPortal />} />
        {}
        <Route element={<DashboardLayout handleLogout={handleLogout} currentUser={currentUser} />}>
          {}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          {}
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
          {}
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/beneficiary-form" element={<BeneficiaryForm />} />
          <Route path="/beneficiary-form/:id" element={<BeneficiaryForm />} />
          <Route path="/field-visits" element={<FieldVisits />} />
          <Route path="/resources" element={<Resources />} />
          {}
          <Route path="/field-officers" element={<FieldOfficers />} />
          {}
          <Route path="/report-generator" element={<ReportGenerator />} />
          {}
          <Route path="/dashboard" element={
             currentUser ? (
                currentUser.role === 'admin' ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/officer-dashboard" replace />
             ) : (
                <Navigate to="/login" replace />
             )
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
{}
          <Route path="/projects" element={<Projects />} />
<Route path="/project-form" element={<ProjectForm />} />
          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;