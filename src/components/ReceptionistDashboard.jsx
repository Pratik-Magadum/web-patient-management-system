import { useCallback, useEffect, useState } from 'react';
import { deletePatient, logoutUser, searchPatients, searchPatientsByNamePhone } from '../services/api';
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
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState({
    totalPatients: 0,
    completedPatients: 0,
    newPatients: 0,
    followUpPatients: 0,
  });

  const fetchPatients = useCallback(async ({ fromDate, toDate, page = 0, size = 10 } = {}) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await searchPatients({ fromDate, toDate, page, size });
      setStats({
        totalPatients: data.totalPatients ?? 0,
        completedPatients: data.completedPatients ?? 0,
        newPatients: data.newPatients ?? 0,
        followUpPatients: data.followUpPatients ?? 0,
      });
      setPatients(Array.isArray(data.patients) ? data.patients : []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalPatients ?? 0);
      setPageNumber(data.currentPage ?? page);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch patients.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientsByNamePhone = useCallback(async ({ name, phonenumber, page = 0, size = 10 } = {}) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await searchPatientsByNamePhone({ name, phonenumber, pageNumber: page, pageSize: size });
      setPatients(Array.isArray(data) ? data : []);
      setTotalPages(0);
      setTotalElements(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch patients.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch patients on initial load (today's data)
  useEffect(() => {
    fetchPatients({ fromDate, toDate, page: 0, size: pageSize });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search by name/phone when user types in the search box
  useEffect(() => {
    const trimmed = searchQuery.trim();
    const timer = setTimeout(() => {
      setPageNumber(0);
      if (!trimmed) {
        fetchPatients({ fromDate, toDate, page: 0, size: pageSize });
        return;
      }
      const isPhone = /^\+?\d[\d\s-]*$/.test(trimmed);
      fetchPatientsByNamePhone({
        name: isPhone ? undefined : trimmed,
        phonenumber: isPhone ? trimmed : undefined,
        page: 0,
        size: pageSize,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fromDate, toDate, fetchPatients, fetchPatientsByNamePhone, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPageNumber(newPage);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      const isPhone = /^\+?\d[\d\s-]*$/.test(trimmed);
      fetchPatientsByNamePhone({
        name: isPhone ? undefined : trimmed,
        phonenumber: isPhone ? trimmed : undefined,
        page: newPage,
        size: pageSize,
      });
    } else {
      fetchPatients({ fromDate, toDate, page: newPage, size: pageSize });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPageNumber(0);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      const isPhone = /^\+?\d[\d\s-]*$/.test(trimmed);
      fetchPatientsByNamePhone({
        name: isPhone ? undefined : trimmed,
        phonenumber: isPhone ? trimmed : undefined,
        page: 0,
        size: newSize,
      });
    } else {
      fetchPatients({ fromDate, toDate, page: 0, size: newSize });
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!patientId) return;
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await deletePatient(patientId);
      fetchPatients({ fromDate, toDate, page: pageNumber, size: pageSize });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete patient.');
    }
  };

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
    setPageNumber(0);
    fetchPatients({ fromDate: pendingFrom, toDate: pendingTo, page: 0, size: pageSize });
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
          <div className="rd-col-action">Action</div>
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
              <div className="rd-col-action">
                <button
                  className="rd-delete-btn"
                  title="Delete patient"
                  onClick={() => handleDeletePatient(patient.patientId)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {!loading && !errorMsg && filteredPatients.length === 0 && (
            <div className="rd-no-results">No patients found matching your search.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="rd-pagination">
            <div className="rd-pagination-info">
              Showing {pageNumber * pageSize + 1}–{Math.min((pageNumber + 1) * pageSize, totalElements)} of {totalElements}
            </div>
            <div className="rd-pagination-controls">
              <button
                className="rd-page-btn"
                disabled={pageNumber === 0}
                onClick={() => handlePageChange(0)}
                title="First page"
              >«</button>
              <button
                className="rd-page-btn"
                disabled={pageNumber === 0}
                onClick={() => handlePageChange(pageNumber - 1)}
              >‹</button>
              {(() => {
                const pages = [];
                const start = Math.max(0, pageNumber - 2);
                const end = Math.min(totalPages, start + 5);
                for (let i = start; i < end; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`rd-page-btn ${i === pageNumber ? 'rd-page-active' : ''}`}
                      onClick={() => handlePageChange(i)}
                    >{i + 1}</button>
                  );
                }
                return pages;
              })()}
              <button
                className="rd-page-btn"
                disabled={pageNumber >= totalPages - 1}
                onClick={() => handlePageChange(pageNumber + 1)}
              >›</button>
              <button
                className="rd-page-btn"
                disabled={pageNumber >= totalPages - 1}
                onClick={() => handlePageChange(totalPages - 1)}
                title="Last page"
              >»</button>
            </div>
            <div className="rd-page-size">
              <label className="rd-page-size-label">Rows:</label>
              <select
                className="rd-page-size-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
