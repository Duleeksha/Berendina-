import React, { useState } from 'react';
// Sidebar import eka ayin kala (App.jsx eken eka handle wena nisa)
import './FieldVisits.css';

const FieldVisits = () => {
  // Local Sidebar state eka ayin kala
  const [viewMode, setViewMode] = useState('month');

  const upcomingVisits = [
    { id: 1, beneficiary: 'John Doe', district: 'District A', date: '2024-02-15', time: '10:00 AM', status: 'scheduled' },
    { id: 2, beneficiary: 'Jane Smith', district: 'District B', date: '2024-02-16', time: '2:00 PM', status: 'scheduled' },
    { id: 3, beneficiary: 'Robert Johnson', district: 'District C', date: '2024-02-18', time: '9:30 AM', status: 'scheduled' },
    { id: 4, beneficiary: 'Maria Garcia', district: 'District A', date: '2024-02-20', time: '11:00 AM', status: 'pending' },
    { id: 5, beneficiary: 'David Lee', district: 'District D', date: '2024-02-22', time: '3:00 PM', status: 'scheduled' },
  ];

  const calendarDays = Array.from({ length: 29 }, (_, i) => i + 1);

  return (
    // Admin Dashboard layout class ekama use karanawa consistency ekata
    <div className="field-visits-page-content">
      
      {/* Header Section */}
      <div className="page-header">
        <div>
          <h1>Field Visits</h1>
          <p>Schedule and track field visits to beneficiaries</p>
        </div>
        
        {/* View Controls (Buttons) */}
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
        </div>
      </div>

      {/* Main Content Grid (Calendar & List) */}
      <div className="calendar-container">
        
        {/* Left Side: Calendar */}
        <div className="content-card calendar-section">
          <div className="card-header-row">
             <h3>February 2024</h3>
             <span className="badge-gray">Current Month</span>
          </div>
          
          <div className="calendar-header">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          
          <div className="calendar-grid">
            {[...Array(4)].map((_, i) => <div key={i} className="empty-day"></div>)}
            {calendarDays.map(day => (
              <div key={day} className={`calendar-day ${day === 15 ? 'has-visit' : ''}`}>
                {day}
              </div>
            ))}
          </div>
          
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-dot has-visit"></div>
              <span>Has Field Visit</span>
            </div>
          </div>
        </div>

        {/* Right Side: Timeline */}
        <div className="content-card timeline-section">
          <h3>Upcoming Visits</h3>
          <div className="timeline-items">
            {upcomingVisits.map(visit => (
              <div key={visit.id} className="timeline-item">
                <div className="timeline-date">{visit.date}</div>
                <div className="timeline-line">
                    <div className="timeline-dot"></div>
                </div>
                <div className="timeline-details">
                  <div className="visit-beneficiary-name">{visit.beneficiary}</div>
                  <div className="visit-location">📍 {visit.district}</div>
                  <div className="visit-time">🕒 {visit.time}</div>
                  <span className={`visit-status ${visit.status}`}>{visit.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FieldVisits;