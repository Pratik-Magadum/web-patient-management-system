import { useCallback, useEffect, useState } from 'react';
import { logoutUser, searchPatients, searchPatientsByNamePhone } from '../services/api';
import '../styles/receptionist.css';

const STATUS_CLASS_MAP = {
  'REGISTERED': 'status-registered',
  'WAITING_FOR_PRE_DIAGNOSTIC': 'status-waiting-prediag',
  'PRE_DIAGNOSED': 'status-prediagnosed',
  'WAITING_FOR_DOCTOR': 'status-waiting-doctor',
  'COMPLETED': 'status-completed',
};

const STATUS_DISPLAY = {
  'REGISTERED': 'Registered',
  'WAITING_FOR_PRE_DIAGNOSTIC': 'Waiting for Pre-Diagnostic',
  'PRE_DIAGNOSED': 'Pre-Diagnosed',
  'WAITING_FOR_DOCTOR': 'Waiting for Doctor',
  'COMPLETED': 'Completed',
};

const VISIT_TYPE_DISPLAY = {
  'NEW_VISIT': 'New Patient',
  'FOLLOW_UP': 'Follow-up',
};

function getStatusClass(status) {
  return STATUS_CLASS_MAP[status] || '';
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export default function ReceptionistDashboard({ hospitalDetails, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [pendingFrom, setPendingFrom] = useState(getToday());
  const [pendingTo, setPendingTo] = useState(getToday());
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const t = new Date(); return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [rangeStart, setRangeStart] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    completedPatients: 0,
    newPatients: 0,
    followUpPatients: 0,
  });

  const fetchPatients = useCallback(async ({ fromDate, toDate } = {}) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await searchPatients({ fromDate, toDate });
      setStats({
        totalPatients: data.totalPatients ?? 0,
        completedPatients: data.completedPatients ?? 0,
        newPatients: data.newPatients ?? 0,
        followUpPatients: data.followUpPatients ?? 0,
      });
      setPatients(Array.isArray(data.patients) ? data.patients : []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch patients.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientsByNamePhone = useCallback(async ({ name, phonenumber } = {}) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await searchPatientsByNamePhone({ name, phonenumber });
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch patients.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch patients on initial load (today's data)
  useEffect(() => {
    fetchPatients({ fromDate, toDate });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search by name/phone when user types in the search box
  useEffect(() => {
    const trimmed = searchQuery.trim();
    const timer = setTimeout(() => {
      if (!trimmed) {
        fetchPatients({ fromDate, toDate });
        return;
      }
      const isPhone = /^\+?\d[\d\s-]*$/.test(trimmed);
      fetchPatientsByNamePhone({
        name: isPhone ? undefined : trimmed,
        phonenumber: isPhone ? trimmed : undefined,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fromDate, toDate, fetchPatients, fetchPatientsByNamePhone]);

  const filteredPatients = patients.filter((p) => {
    if (activeFilter === 'completed') return p.appointmentStatus === 'COMPLETED';
    if (activeFilter === 'new') return p.visitType === 'NEW_VISIT';
    if (activeFilter === 'followup') return p.visitType === 'FOLLOW_UP';
    return true;
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

  const today = getToday();

  const buildCalendarDays = () => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  };

  const handleCalendarDayClick = (dateStr) => {
    if (dateStr > today) return;
    if (!rangeStart) {
      setRangeStart(dateStr);
      setPendingFrom(dateStr);
      setPendingTo(dateStr);
    } else {
      const start = dateStr < rangeStart ? dateStr : rangeStart;
      const end = dateStr < rangeStart ? rangeStart : dateStr;
      setPendingFrom(start);
      setPendingTo(end);
      setRangeStart(null);
    }
  };

  const isInRange = (dateStr) => {
    if (!dateStr) return false;
    if (rangeStart) {
      return dateStr === rangeStart;
    }
    return dateStr >= pendingFrom && dateStr <= pendingTo;
  };

  const isRangeEdge = (dateStr) => {
    if (!dateStr) return false;
    return dateStr === pendingFrom || dateStr === pendingTo;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      const m = prev.month - 1;
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
    });
  };

  const nextMonth = () => {
    const next = calendarMonth.month + 1 > 11
      ? { year: calendarMonth.year + 1, month: 0 }
      : { year: calendarMonth.year, month: calendarMonth.month + 1 };
    const firstOfNext = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`;
    if (firstOfNext > today) return;
    setCalendarMonth(next);
  };

  const applyPreset = (from, to) => {
    setPendingFrom(from);
    setPendingTo(to);
    setRangeStart(null);
    const d = new Date(from);
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  const handleApplyDateRange = () => {
    setFromDate(pendingFrom);
    setToDate(pendingTo);
    setRangeStart(null);
    setDateRangeOpen(false);
    fetchPatients({ fromDate: pendingFrom, toDate: pendingTo });
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
          <div className="rd-date-range-wrapper">
            <button
              className="rd-date-range-btn"
              onClick={() => {
                if (!dateRangeOpen) {
                  setPendingFrom(fromDate);
                  setPendingTo(toDate);
                  setRangeStart(null);
                }
                setDateRangeOpen(!dateRangeOpen);
              }}
            >
              <span className="rd-date-range-icon">📅</span>
              <span className="rd-date-range-text">
                {fromDate === toDate
                  ? formatDisplayDate(fromDate)
                  : `${formatDisplayDate(fromDate)}  →  ${formatDisplayDate(toDate)}`}
              </span>
              <span className={`rd-date-range-arrow ${dateRangeOpen ? 'open' : ''}`}>▾</span>
            </button>
            {dateRangeOpen && (
              <div className="rd-date-range-dropdown">
                <div className="rd-cal-header">
                  <button className="rd-cal-nav" onClick={prevMonth}>‹</button>
                  <span className="rd-cal-title">{monthNames[calendarMonth.month]} {calendarMonth.year}</span>
                  <button className="rd-cal-nav" onClick={nextMonth}>›</button>
                </div>
                <div className="rd-cal-weekdays">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="rd-cal-wd">{d}</span>
                  ))}
                </div>
                <div className="rd-cal-grid">
                  {buildCalendarDays().map((dateStr, i) => (
                    <button
                      key={i}
                      className={`rd-cal-day${!dateStr ? ' rd-cal-empty' : ''}${dateStr && dateStr > today ? ' rd-cal-disabled' : ''}${dateStr && isRangeEdge(dateStr) ? ' rd-cal-edge' : ''}${dateStr && isInRange(dateStr) && !isRangeEdge(dateStr) ? ' rd-cal-in-range' : ''}${dateStr === today ? ' rd-cal-today' : ''}`}
                      disabled={!dateStr || dateStr > today}
                      onClick={() => dateStr && handleCalendarDayClick(dateStr)}
                    >
                      {dateStr ? parseInt(dateStr.split('-')[2], 10) : ''}
                    </button>
                  ))}
                </div>
                {rangeStart && (
                  <div className="rd-cal-hint">Click another date to complete the range</div>
                )}
                <div className="rd-cal-selected-range">
                  <div className="rd-cal-range-item">
                    <span className="rd-cal-range-label">From:</span>
                    <span className="rd-cal-range-value">{formatDisplayDate(pendingFrom)}</span>
                  </div>
                  <span className="rd-cal-range-arrow">→</span>
                  <div className="rd-cal-range-item">
                    <span className="rd-cal-range-label">To:</span>
                    <span className="rd-cal-range-value">{formatDisplayDate(pendingTo)}</span>
                  </div>
                </div>
                <div className="rd-date-presets">
                  <button className="rd-preset-btn" onClick={() => applyPreset(getToday(), getToday())}>Today</button>
                  <button className="rd-preset-btn" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); applyPreset(d.toISOString().split('T')[0], getToday()); }}>Last 7 days</button>
                  <button className="rd-preset-btn" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 30); applyPreset(d.toISOString().split('T')[0], getToday()); }}>Last 30 days</button>
                </div>
                <button className="rd-date-apply-btn" onClick={handleApplyDateRange}>Apply</button>
              </div>
            )}
          </div>
          <button className="rd-new-patient-btn">+ New Patient</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="rd-stats-row">
        <div
          className={`rd-stat-card ${activeFilter === 'all' ? 'rd-stat-active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="rd-stat-label">📅 Appointments</div>
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
            All Patient Appointments · {fromDate === toDate ? formatDisplayDate(fromDate) : `${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}`}
          </h2>
          <span className="rd-patient-count">{filteredPatients.length} patients</span>
        </div>

        <div className="rd-patient-table-header">
          <div className="rd-col-name">Patient Name</div>
          <div className="rd-col-datetime">Appointment Date & Time</div>
          <div className="rd-col-mobile">Mobile Number</div>
          <div className="rd-col-status">Status</div>
        </div>

        <div className="rd-patient-list">
          {loading && (
            <div className="rd-no-results">Loading patients...</div>
          )}
          {!loading && errorMsg && (
            <div className="rd-no-results rd-error-msg">{errorMsg}</div>
          )}
          {!loading && !errorMsg && filteredPatients.map((patient, index) => (
            <div key={`${patient.patientName}-${patient.appointmentTime}-${index}`} className="rd-patient-card">
              <div className="rd-col-name rd-patient-name-cell">
                <div className="rd-patient-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="2" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="rd-patient-info">
                  <div className="rd-patient-name">{patient.patientName}</div>
                  <span className="rd-patient-type-badge">{VISIT_TYPE_DISPLAY[patient.visitType] || patient.visitType}</span>
                </div>
              </div>
              <div className="rd-col-datetime rd-patient-datetime">
                {patient.appointmentDate} {formatTime12h(patient.appointmentTime)}
              </div>
              <div className="rd-col-mobile rd-patient-mobile">{patient.mobileNumber}</div>
              <div className="rd-col-status">
                <span className={`rd-patient-status ${getStatusClass(patient.appointmentStatus)}`}>
                  {STATUS_DISPLAY[patient.appointmentStatus] || patient.appointmentStatus}
                </span>
              </div>
            </div>
          ))}

          {!loading && !errorMsg && filteredPatients.length === 0 && (
            <div className="rd-no-results">No patients found matching your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
