import { useEffect, useState } from 'react';
import { getDashboardStats, logoutUser } from '../services/api';
import '../styles/receptionist.css';

const STATIC_PATIENTS = [
  { id: 1, name: 'John Smith', phone: '+1-555-0123', time: '09:00', type: 'New Patient', status: 'Registered' },
  { id: 2, name: 'Emma Davis', phone: '+1-555-0124', time: '09:30', type: 'New Patient', status: 'Waiting for Pre-Diagnostic' },
  { id: 3, name: 'Michael Chen', phone: '+1-555-0125', time: '10:00', type: 'New Patient', status: 'Pre-Diagnosed' },
  { id: 4, name: 'Lisa Anderson', phone: '+1-555-0126', time: '10:30', type: 'New Patient', status: 'Waiting for Doctor' },
  { id: 5, name: 'David Rodriguez', phone: '+1-555-0127', time: '11:00', type: 'New Patient', status: 'Registered' },
  { id: 6, name: 'Sarah Wilson', phone: '+1-555-0128', time: '11:30', type: 'Follow-up', status: 'Waiting for Pre-Diagnostic' },
  { id: 7, name: 'James Taylor', phone: '+1-555-0129', time: '12:00', type: 'New Patient', status: 'Completed' },
  { id: 8, name: 'Emily Brown', phone: '+1-555-0130', time: '12:30', type: 'New Patient', status: 'Completed' },
  { id: 9, name: 'Robert Martinez', phone: '+1-555-0131', time: '13:00', type: 'Follow-up', status: 'Waiting for Doctor' },
  { id: 10, name: 'Jennifer Lee', phone: '+1-555-0132', time: '13:30', type: 'New Patient', status: 'Registered' },
  { id: 11, name: 'William Garcia', phone: '+1-555-0133', time: '14:00', type: 'New Patient', status: 'Waiting for Pre-Diagnostic' },
  { id: 12, name: 'Amanda Clark', phone: '+1-555-0134', time: '14:30', type: 'Follow-up', status: 'Pre-Diagnosed' },
  { id: 13, name: 'Christopher Hall', phone: '+1-555-0135', time: '15:00', type: 'New Patient', status: 'Waiting for Doctor' },
  { id: 14, name: 'Jessica White', phone: '+1-555-0136', time: '15:30', type: 'New Patient', status: 'Registered' },
  { id: 15, name: 'Daniel Harris', phone: '+1-555-0137', time: '16:00', type: 'New Patient', status: 'Completed' },
  { id: 16, name: 'Ashley King', phone: '+1-555-0138', time: '16:30', type: 'Follow-up', status: 'Completed' },
  { id: 17, name: 'Matthew Wright', phone: '+1-555-0139', time: '17:00', type: 'New Patient', status: 'Waiting for Pre-Diagnostic' },
  { id: 18, name: 'Sophia Lopez', phone: '+1-555-0140', time: '17:30', type: 'New Patient', status: 'Registered' },
];

const STATUS_CLASS_MAP = {
  'Registered': 'status-registered',
  'Waiting for Pre-Diagnostic': 'status-waiting-prediag',
  'Pre-Diagnosed': 'status-prediagnosed',
  'Waiting for Doctor': 'status-waiting-doctor',
  'Completed': 'status-completed',
};

function getStatusClass(status) {
  return STATUS_CLASS_MAP[status] || '';
}

export default function ReceptionistDashboard({ hospitalDetails, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2025-09-29');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    totalPatients: 0,
    completedPatients: 0,
    newPatients: 0,
    followUpPatients: 0,
  });

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats({
          totalPatients: data.totalPatients,
          completedPatients: data.completedPatients,
          newPatients: data.newPatients,
          followUpPatients: data.followUpPatients,
        });
      })
      .catch((err) => console.error('Failed to load dashboard stats:', err));
  }, []);

  const filteredPatients = STATIC_PATIENTS.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    let matchesFilter = true;
    if (activeFilter === 'completed') {
      matchesFilter = p.status === 'Completed';
    } else if (activeFilter === 'new') {
      matchesFilter = p.type === 'New Patient';
    } else if (activeFilter === 'followup') {
      matchesFilter = p.type === 'Follow-up';
    }

    return matchesSearch && matchesFilter;
  });

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="rd-page">

      {/* Header */}
      <div className="rd-header">
        <div className="rd-header-left">
          <span className="rd-hospital-icon">👁️</span>
          <div>
            <h1 className="rd-hospital-name">{hospitalDetails?.name || 'Eye Hospital Management'}</h1>
            <p className="rd-role-label">Receptionist Dashboard</p>
          </div>
        </div>
        <button className="rd-logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* Search & Actions Bar */}
      <div className="rd-actions-bar">
        <div className="rd-search-box">
          <span className="rd-search-icon">⌕</span>
          <input
            type="text"
            className="rd-search-input"
            placeholder="Search patients by name or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="rd-actions-right">
          <input
            type="date"
            className="rd-date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="rd-new-patient-btn">+ New Patient</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="rd-stats-row">
        <div
          className={`rd-stat-card ${activeFilter === 'all' ? 'rd-stat-active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="rd-stat-label">📅 Today's Appointments</div>
          <div className="rd-stat-value">{stats.totalPatients}</div>
        </div>
        <div
          className={`rd-stat-card ${activeFilter === 'completed' ? 'rd-stat-active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          <div className="rd-stat-label">✅ Completed</div>
          <div className="rd-stat-value">{stats.completedPatients}</div>
        </div>
        <div
          className={`rd-stat-card ${activeFilter === 'new' ? 'rd-stat-active' : ''}`}
          onClick={() => setActiveFilter('new')}
        >
          <div className="rd-stat-label">👥 New Patients</div>
          <div className="rd-stat-value">{stats.newPatients}</div>
        </div>
        <div
          className={`rd-stat-card ${activeFilter === 'followup' ? 'rd-stat-active' : ''}`}
          onClick={() => setActiveFilter('followup')}
        >
          <div className="rd-stat-label">🔄 Follow-up Patients</div>
          <div className="rd-stat-value">{stats.followUpPatients}</div>
        </div>
      </div>

      {/* Patient List */}
      <div className="rd-patient-list-container">
        <div className="rd-patient-list-header">
          <h2 className="rd-patient-list-title">
            All Patient Appointments · {formatDisplayDate(selectedDate)}
          </h2>
          <span className="rd-patient-count">{filteredPatients.length} patients</span>
        </div>

        <div className="rd-patient-table-header">
          <div className="rd-col-name">Patient Name</div>
          <div className="rd-col-mobile">Mobile Number</div>
          <div className="rd-col-status">Status</div>
        </div>

        <div className="rd-patient-list">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="rd-patient-card">
              <div className="rd-col-name rd-patient-name-cell">
                <div className="rd-patient-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="2" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="rd-patient-info">
                  <div className="rd-patient-name">{patient.name}</div>
                  <div className="rd-patient-time">{patient.time}</div>
                  <span className="rd-patient-type-badge">{patient.type}</span>
                </div>
              </div>
              <div className="rd-col-mobile rd-patient-mobile">{patient.phone}</div>
              <div className="rd-col-status">
                <span className={`rd-patient-status ${getStatusClass(patient.status)}`}>
                  {patient.status}
                </span>
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="rd-no-results">No patients found matching your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
