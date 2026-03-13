import React, { useState, useEffect } from 'react';
import './FieldVisits.css';

const FieldVisits = () => {
  const [viewMode, setViewMode] = useState('month');
  
  // Real data ganna states
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Fetch Real Visits ---
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/field-visits');
        if (response.ok) {
          const data = await response.json();
          setVisits(data);
        }
      } catch (error) {
        console.error('Network error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, []);

  // Calendar eke dot eka penna visit thiyena dawas tika extract karanawa
  const visitDates = visits.map(v => parseInt(v.date.split('-')[2]));
  const calendarDays = Array.from({ length: 29 }, (_, i) => i + 1);

  return (
    <div className="field-visits-page-content">
      <div className="page-header">
        <div>
          <h1>Field Visits</h1>
          <p>Schedule and track field visits to beneficiaries</p>
        </div>
        <div className="view-controls">
          {['month', 'week', 'day'].map(mode => (
            <button key={mode} className={`view-btn ${viewMode === mode ? 'active' : ''}`} onClick={() => setViewMode(mode)}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-container">
        <div className="content-card calendar-section">
          <div className="card-header-row">
             <h3>February 2024</h3>
             <span className="badge-gray">Current Month</span>
          </div>
          
          <div className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="calendar-grid">
            {[...Array(4)].map((_, i) => <div key={i} className="empty-day"></div>)}
            {calendarDays.map(day => (
              <div key={day} className={`calendar-day ${visitDates.includes(day) ? 'has-visit' : ''}`}>
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

        <div className="content-card timeline-section">
          <h3>Upcoming Visits</h3>
          <div className="timeline-items">
            {loading ? <p>Loading visits...</p> : (
              visits.length > 0 ? visits.map(visit => (
                <div key={visit.id} className="timeline-item">
                  <div className="timeline-date">{visit.date}</div>
                  <div className="timeline-line"><div className="timeline-dot"></div></div>
                  <div className="timeline-details">
                    <div className="visit-beneficiary-name">{visit.beneficiary}</div>
                    <div className="visit-location">📍 {visit.district}</div>
                    <div className="visit-officer">👤 Officer: {visit.officerName || 'Not Assigned'}</div>
                    <div className="visit-time">🕒 {visit.time}</div>
                    <span className={`visit-status ${visit.status}`}>{visit.status}</span>
                  </div>
                </div>
              )) : <p>No visits scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldVisits;