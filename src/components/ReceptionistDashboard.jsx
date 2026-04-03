import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteAppointment, editPatient, logoutUser, registerFollowUpPatient, registerNewPatient, searchPatients, searchPatientsByNamePhone, updateAppointmentStatus } from '../services/api';
import '../styles/receptionist.css';

// ─── Constants ──────────────────────────────────────

const STATUS_CLASS_MAP = {
  'REGISTERED': 'status-registered',
  'IN_PROGRESS': 'status-in-progress',
  'COMPLETED': 'status-completed',
};

const STATUS_DISPLAY = {
  'REGISTERED': 'Registered',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
};

/** Appointment status enum — defines the allowed workflow order. */
const APPOINTMENT_STATUS = Object.freeze({
  REGISTERED: 'REGISTERED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

const STATUS_ORDER = [APPOINTMENT_STATUS.REGISTERED, APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.COMPLETED];

/** Numeric priority used for sorting rows by status. Lower = higher in the list. */
const STATUS_SORT_PRIORITY = {
  [APPOINTMENT_STATUS.REGISTERED]: 0,
  [APPOINTMENT_STATUS.IN_PROGRESS]: 1,
  [APPOINTMENT_STATUS.COMPLETED]: 2,
};

const VISIT_TYPE_DISPLAY = {
  'NEW_VISIT': 'New Patient',
  'FOLLOW_UP': 'Follow-up',
};

const FILTER_API_PARAMS = {
  all: {},
  completed: { patientStatus: 'COMPLETED' },
  new: { visitType: 'NEW_VISIT' },
  followup: { visitType: 'FOLLOW_UP' },
};

const STAT_CARDS = [
  { key: 'all', icon: '📅', label: 'Appointments', stat: 'totalPatients' },
  { key: 'completed', icon: '✅', label: 'Completed', stat: 'completedPatients' },
  { key: 'new', icon: '👥', label: 'New Patients', stat: 'newPatients' },
  { key: 'followup', icon: '🔄', label: 'Follow-up Patients', stat: 'followUpPatients' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const INITIAL_PATIENT_FORM = { fullName: '', mobileNumber: '', email: '', age: '', gender: '', dateOfBirth: '', address: '', appointmentDate: '', appointmentTime: '', notes: '' };
const INITIAL_STATS = { totalPatients: 0, completedPatients: 0, newPatients: 0, followUpPatients: 0 };

// ─── SVG Icons ──────────────────────────────────────

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="2" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

// ─── Utility Functions ──────────────────────────────

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatDisplayDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

function parseSearchQuery(query) {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const isPhone = /^\+?\d[\d\s-]*$/.test(trimmed);
  return {
    name: isPhone ? undefined : trimmed,
    phonenumber: isPhone ? trimmed : undefined,
  };
}

function getCalendarDayClass(dateStr, today, pendingFrom, pendingTo, rangeStart) {
  if (!dateStr) return 'rd-cal-day rd-cal-empty';
  const classes = ['rd-cal-day'];
  if (dateStr > today) classes.push('rd-cal-disabled');
  if (dateStr === today) classes.push('rd-cal-today');
  const isEdge = dateStr === pendingFrom || dateStr === pendingTo;
  const inRange = rangeStart
    ? dateStr === rangeStart
    : dateStr >= pendingFrom && dateStr <= pendingTo;
  if (isEdge) classes.push('rd-cal-edge');
  else if (inRange) classes.push('rd-cal-in-range');
  return classes.join(' ');
}

// ─── Shared Form Helpers ────────────────────────────

function validatePatientForm(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (!form.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!/^(\+91-?)?\d{10}$/.test(form.mobileNumber.trim())) {
    errors.mobileNumber = 'Enter a valid mobile number (e.g. 9800000001 or +91-9800000001)';
  }
  if (!form.age) {
    errors.age = 'Age is required';
  } else if (isNaN(form.age) || Number(form.age) < 0 || Number(form.age) > 150) {
    errors.age = 'Enter a valid age (0-150)';
  }
  if (!form.gender) errors.gender = 'Gender is required';
  return errors;
}

function buildPatientPayload(form) {
  const payload = {
    fullName: form.fullName.trim(),
    mobileNumber: form.mobileNumber.trim(),
    age: Number(form.age),
    gender: form.gender,
    appointmentDate: form.appointmentDate || getToday(),
    appointmentTime: form.appointmentTime || '00:00:00',
  };
  if (form.email.trim()) payload.email = form.email.trim();
  if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
  if (form.address.trim()) payload.address = form.address.trim();
  if (form.notes.trim()) payload.notes = form.notes.trim();
  return payload;
}

function PatientFormFields({ form, errors, onChange }) {
  return (
    <>
      <div className="rd-form-row">
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Full Name <span className="rd-required">*</span></label>
          <input
            type="text"
            name="fullName"
            className={`rd-form-input ${errors.fullName ? 'rd-input-error' : ''}`}
            placeholder="Enter patient's full name"
            value={form.fullName}
            onChange={onChange}
            autoFocus
          />
          {errors.fullName && <span className="rd-field-error">{errors.fullName}</span>}
        </div>
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Gender <span className="rd-required">*</span></label>
          <select
            name="gender"
            className={`rd-form-input ${errors.gender ? 'rd-input-error' : ''}`}
            value={form.gender}
            onChange={onChange}
          >
            {GENDER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.gender && <span className="rd-field-error">{errors.gender}</span>}
        </div>
      </div>

      <div className="rd-form-row">
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Age <span className="rd-required">*</span></label>
          <input
            type="number"
            name="age"
            className={`rd-form-input ${errors.age ? 'rd-input-error' : ''}`}
            placeholder="Enter age"
            value={form.age}
            onChange={onChange}
            min="0"
            max="150"
          />
          {errors.age && <span className="rd-field-error">{errors.age}</span>}
        </div>
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Phone Number <span className="rd-required">*</span></label>
          <input
            type="tel"
            name="mobileNumber"
            className={`rd-form-input ${errors.mobileNumber ? 'rd-input-error' : ''}`}
            placeholder="Enter phone number"
            value={form.mobileNumber}
            onChange={onChange}
            maxLength={15}
          />
          {errors.mobileNumber && <span className="rd-field-error">{errors.mobileNumber}</span>}
        </div>
      </div>

      <div className="rd-form-row">
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Email</label>
          <input
            type="email"
            name="email"
            className="rd-form-input"
            placeholder="Enter email address"
            value={form.email}
            onChange={onChange}
          />
        </div>
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            className="rd-form-input"
            value={form.dateOfBirth}
            onChange={onChange}
            max={getToday()}
          />
        </div>
      </div>

      <div className="rd-form-group">
        <label className="rd-form-label">Address</label>
        <input
          type="text"
          name="address"
          className="rd-form-input"
          placeholder="Enter patient's full address"
          value={form.address}
          onChange={onChange}
        />
      </div>

      <div className="rd-form-row">
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Appointment Date</label>
          <input
            type="date"
            name="appointmentDate"
            className="rd-form-input"
            value={form.appointmentDate}
            onChange={onChange}
          />
        </div>
        <div className="rd-form-group rd-form-half">
          <label className="rd-form-label">Appointment Time</label>
          <input
            type="time"
            name="appointmentTime"
            className="rd-form-input"
            value={form.appointmentTime}
            onChange={onChange}
            step="1"
          />
        </div>
      </div>

      <div className="rd-form-group">
        <label className="rd-form-label">Notes</label>
        <textarea
          name="notes"
          className="rd-form-input rd-form-textarea"
          placeholder="Enter any notes (e.g. Eye checkup, Follow-up)"
          value={form.notes}
          onChange={onChange}
          rows={3}
        />
      </div>
    </>
  );
}

export default function ReceptionistDashboard({ hospitalDetails, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(getToday);
  const [toDate, setToDate] = useState(getToday);
  const [pendingFrom, setPendingFrom] = useState(getToday);
  const [pendingTo, setPendingTo] = useState(getToday);
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
  const [stats, setStats] = useState(INITIAL_STATS);

  // ─── New Patient Modal State ─────────────────────
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState(INITIAL_PATIENT_FORM);
  const [newPatientErrors, setNewPatientErrors] = useState({});
  const [newPatientSubmitting, setNewPatientSubmitting] = useState(false);
  const [newPatientSuccess, setNewPatientSuccess] = useState('');

  // ─── Edit Patient Modal State ─────────────────────
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState(INITIAL_PATIENT_FORM);
  const [editPatientErrors, setEditPatientErrors] = useState({});
  const [editPatientSubmitting, setEditPatientSubmitting] = useState(false);
  const [editPatientSuccess, setEditPatientSuccess] = useState('');
  const [editPatientId, setEditPatientId] = useState('');

  // ─── Follow-up Patient Modal State ────────────────
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [followUpResults, setFollowUpResults] = useState([]);
  const [followUpSearching, setFollowUpSearching] = useState(false);
  const [selectedFollowUpPatient, setSelectedFollowUpPatient] = useState(null);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState('');
  const [followUpError, setFollowUpError] = useState('');
  const [followUpDate, setFollowUpDate] = useState(getToday);
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const today = useMemo(getToday, []);

  // ─── Core Fetch Helpers ───────────────────────────

  const fetchPatients = useCallback(async ({ fromDate, toDate, patientStatus, visitType, page = 0, size = 10 } = {}) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await searchPatients({ fromDate, toDate, patientStatus, visitType, page, size });
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

  // Unified refresh: uses current dates + active filter
  const refreshPatientList = useCallback((page, size, filter) => {
    return fetchPatients({
      fromDate, toDate,
      ...(FILTER_API_PARAMS[filter ?? activeFilter] || {}),
      page, size,
    });
  }, [fromDate, toDate, activeFilter, fetchPatients]);

  // Fetch by search query or refresh full list
  const fetchBySearchOrRefresh = useCallback((query, page, size) => {
    const parsed = parseSearchQuery(query);
    if (parsed) {
      return fetchPatientsByNamePhone({ ...parsed, page, size });
    }
    return refreshPatientList(page, size);
  }, [fetchPatientsByNamePhone, refreshPatientList]);

  // ─── Effects ──────────────────────────────────────

  useEffect(() => {
    refreshPatientList(0, pageSize);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageNumber(0);
      fetchBySearchOrRefresh(searchQuery, 0, pageSize);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fromDate, toDate, activeFilter, fetchBySearchOrRefresh, pageSize]);

  // ─── Event Handlers ───────────────────────────────

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPageNumber(newPage);
    fetchBySearchOrRefresh(searchQuery, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPageNumber(0);
    fetchBySearchOrRefresh(searchQuery, 0, newSize);
  };

  const handleDeletePatient = async (appointmentId) => {
    if (!appointmentId || !window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await deleteAppointment(appointmentId);
      refreshPatientList(pageNumber, pageSize);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete appointment.');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setErrorMsg('');
      refreshPatientList(pageNumber, pageSize);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status.');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPageNumber(0);
    fetchPatients({ fromDate, toDate, ...(FILTER_API_PARAMS[filter] || {}), page: 0, size: pageSize });
  };

  const handleEditPatient = (patient) => {
    setEditPatientId(patient.patientId || '');
    setEditPatientForm({
      fullName: patient.patientName || '',
      mobileNumber: patient.mobileNumber || '',
      email: patient.email || '',
      age: patient.age != null ? String(patient.age) : '',
      gender: patient.gender || '',
      dateOfBirth: patient.dateOfBirth || '',
      address: patient.address || '',
      appointmentDate: patient.appointmentDate || getToday(),
      appointmentTime: patient.appointmentTime || '',
      notes: patient.notes || '',
    });
    setEditPatientErrors({});
    setEditPatientSuccess('');
    setShowEditPatientModal(true);
  };

  const closeEditPatientModal = () => {
    setShowEditPatientModal(false);
    setEditPatientErrors({});
    setEditPatientSuccess('');
  };

  const handleEditPatientChange = (e) => {
    const { name, value } = e.target;
    setEditPatientForm((prev) => ({ ...prev, [name]: value }));
    if (editPatientErrors[name]) {
      setEditPatientErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEditPatientSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePatientForm(editPatientForm);
    if (Object.keys(errors).length > 0) {
      setEditPatientErrors(errors);
      return;
    }
    setEditPatientSubmitting(true);
    setEditPatientSuccess('');
    try {
      await editPatient(editPatientId, buildPatientPayload(editPatientForm));
      setEditPatientSuccess('Patient updated successfully!');
      refreshPatientList(pageNumber, pageSize);
      setTimeout(() => closeEditPatientModal(), 1200);
    } catch (err) {
      setEditPatientErrors({ submit: err.message || 'Update failed. Please try again.' });
    } finally {
      setEditPatientSubmitting(false);
    }
  };

  // ─── New Patient Modal Handlers ─────────────────────
  const openNewPatientModal = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    setNewPatientForm({ ...INITIAL_PATIENT_FORM, appointmentDate: getToday(), appointmentTime: currentTime });
    setNewPatientErrors({});
    setNewPatientSuccess('');
    setShowNewPatientModal(true);
  };

  const closeNewPatientModal = () => {
    setShowNewPatientModal(false);
    setNewPatientErrors({});
    setNewPatientSuccess('');
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatientForm((prev) => ({ ...prev, [name]: value }));
    if (newPatientErrors[name]) {
      setNewPatientErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleNewPatientSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePatientForm(newPatientForm);
    if (Object.keys(errors).length > 0) {
      setNewPatientErrors(errors);
      return;
    }
    setNewPatientSubmitting(true);
    setNewPatientSuccess('');
    try {
      await registerNewPatient(buildPatientPayload(newPatientForm));
      setNewPatientSuccess('Patient registered successfully!');
      refreshPatientList(pageNumber, pageSize);
      setTimeout(() => closeNewPatientModal(), 1200);
    } catch (err) {
      setNewPatientErrors({ submit: err.message || 'Registration failed. Please try again.' });
    } finally {
      setNewPatientSubmitting(false);
    }
  };

  // ─── Follow-up Patient Modal Handlers ────────────────
  const openFollowUpModal = () => {
    setFollowUpSearch('');
    setFollowUpResults([]);
    setSelectedFollowUpPatient(null);
    setFollowUpDate(getToday());
    setFollowUpTime('');
    setFollowUpNotes('');
    setFollowUpSuccess('');
    setFollowUpError('');
    setShowFollowUpModal(true);
  };

  const closeFollowUpModal = () => {
    setShowFollowUpModal(false);
    setFollowUpSuccess('');
    setFollowUpError('');
    setFollowUpNotes('');
  };

  const handleFollowUpSearch = async () => {
    const query = followUpSearch.trim();
    if (!query) return;
    setFollowUpSearching(true);
    setFollowUpError('');
    setSelectedFollowUpPatient(null);
    try {
      const parsed = parseSearchQuery(query);
      const data = await searchPatientsByNamePhone({
        ...parsed,
        patientStatus: 'COMPLETED',
        pageNumber: 0,
        pageSize: 20,
      });
      const results = Array.isArray(data) ? data : [];
      setFollowUpResults(results);
      if (results.length === 0) {
        setFollowUpError('No patients found. Try a different search.');
      }
    } catch (err) {
      setFollowUpError(err.message || 'Search failed.');
      setFollowUpResults([]);
    } finally {
      setFollowUpSearching(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!selectedFollowUpPatient) return;
    if (!selectedFollowUpPatient.appointmentId) {
      setFollowUpError('Selected patient does not have a valid appointment. Please select another patient.');
      return;
    }
    if (!followUpDate) {
      setFollowUpError('Appointment date is required.');
      return;
    }
    if (!followUpTime) {
      setFollowUpError('Appointment time is required.');
      return;
    }
    setFollowUpSubmitting(true);
    setFollowUpError('');
    setFollowUpSuccess('');
    try {
      await registerFollowUpPatient({
        parentAppointmentId: selectedFollowUpPatient.appointmentId,
        appointmentDate: followUpDate,
        appointmentTime: followUpTime,
        notes: followUpNotes.trim() || undefined,
      });
      setFollowUpSuccess('Follow-up visit registered successfully!');
      refreshPatientList(pageNumber, pageSize);
      setTimeout(() => closeFollowUpModal(), 1200);
    } catch (err) {
      setFollowUpError(err.message || 'Follow-up registration failed.');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  // ─── Calendar & Date Range ────────────────────────

  const handleLogout = async () => {
    await logoutUser();
    onLogout ? onLogout() : (window.location.href = '/');
  };

  const buildCalendarDays = () => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
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
      const [start, end] = dateStr < rangeStart ? [dateStr, rangeStart] : [rangeStart, dateStr];
      setPendingFrom(start);
      setPendingTo(end);
      setRangeStart(null);
    }
  };

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
    if (`${next.year}-${String(next.month + 1).padStart(2, '0')}-01` > today) return;
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
    fetchPatients({ fromDate: pendingFrom, toDate: pendingTo, ...(FILTER_API_PARAMS[activeFilter] || {}), page: 0, size: pageSize });
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
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPageNumber(0); fetchBySearchOrRefresh(searchQuery, 0, pageSize); } }}
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
                  <span className="rd-cal-title">{MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}</span>
                  <button className="rd-cal-nav" onClick={nextMonth}>›</button>
                </div>
                <div className="rd-cal-weekdays">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="rd-cal-wd">{d}</span>
                  ))}
                </div>
                <div className="rd-cal-grid">
                  {buildCalendarDays().map((dateStr, i) => (
                    <button
                      key={i}
                      className={getCalendarDayClass(dateStr, today, pendingFrom, pendingTo, rangeStart)}
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
                  <button className="rd-preset-btn" onClick={() => applyPreset(daysAgo(7), getToday())}>Last 7 days</button>
                  <button className="rd-preset-btn" onClick={() => applyPreset(daysAgo(30), getToday())}>Last 30 days</button>
                </div>
                <button className="rd-date-apply-btn" onClick={handleApplyDateRange}>Apply</button>
              </div>
            )}
          </div>
          <button className="rd-new-patient-btn" onClick={openNewPatientModal}>+ New Patient</button>
          <button className="rd-followup-btn" onClick={openFollowUpModal}>🔄 Follow-up</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="rd-stats-row">
        {STAT_CARDS.map(({ key, icon, label, stat }) => (
          <div
            key={key}
            className={`rd-stat-card ${activeFilter === key ? 'rd-stat-active' : ''}`}
            onClick={() => handleFilterChange(key)}
          >
            <div className="rd-stat-label">{icon} {label}</div>
            <div className="rd-stat-value">{stats[stat]}</div>
          </div>
        ))}
      </div>

      {/* Patient List */}
      <div className="rd-patient-list-container">
        <div className="rd-patient-list-header">
          <h2 className="rd-patient-list-title">
            All Patient Appointments · {fromDate === toDate ? formatDisplayDate(fromDate) : `${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}`}
          </h2>
          <span className="rd-patient-count">{patients.length} patients</span>
        </div>

        <div className="rd-patient-table-header">
          <div className="rd-col-name">Patient Name</div>
          <div className="rd-col-datetime">Appointment Date & Time</div>
          <div className="rd-col-mobile">Mobile Number</div>
          <div className="rd-col-status">Status</div>
          <div className="rd-col-edit">Edit</div>
          <div className="rd-col-delete">Delete</div>
        </div>

        <div className="rd-patient-list">
          {errorMsg && (
            <div className="rd-error-banner">
              <span>{errorMsg}</span>
              <button className="rd-error-banner-close" onClick={() => setErrorMsg('')}>✕</button>
            </div>
          )}
          {loading && (
            <div className="rd-no-results">Loading patients...</div>
          )}
          {!loading && [...patients].sort((a, b) => (STATUS_SORT_PRIORITY[a.appointmentStatus] ?? 99) - (STATUS_SORT_PRIORITY[b.appointmentStatus] ?? 99)).map((patient, index) => (
            <div key={patient.appointmentId || `${patient.patientName}-${index}`} className="rd-patient-card">
              <div className="rd-col-name rd-patient-name-cell">
                <div className="rd-patient-avatar"><UserIcon /></div>
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
                <select
                  className={`rd-status-dropdown ${STATUS_CLASS_MAP[patient.appointmentStatus] || ''}`}
                  value={patient.appointmentStatus}
                  onChange={(e) => handleStatusChange(patient.appointmentId, e.target.value)}
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>{STATUS_DISPLAY[status]}</option>
                  ))}
                </select>
              </div>
              <div className="rd-col-edit">
                <button
                  className="rd-action-btn rd-edit-btn"
                  title="Edit patient"
                  onClick={() => handleEditPatient(patient)}
                >
                  <EditIcon />
                  <span>Edit</span>
                </button>
              </div>
              <div className="rd-col-delete">
                <button
                  className="rd-action-btn rd-delete-btn"
                  title="Delete patient"
                  onClick={() => handleDeletePatient(patient.appointmentId)}
                >
                  <DeleteIcon />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {!loading && patients.length === 0 && (
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
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── New Patient Modal ─────────────────────── */}
      {showNewPatientModal && (
        <div className="rd-modal-overlay" onClick={closeNewPatientModal}>
          <div className="rd-modal rd-modal-new-patient" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-header">
              <div>
                <h2 className="rd-modal-title">Add New Patient</h2>
                <p className="rd-modal-subtitle">Enter patient information to create a new patient record.</p>
              </div>
              <button className="rd-modal-close" onClick={closeNewPatientModal}>✕</button>
            </div>
            <form onSubmit={handleNewPatientSubmit} className="rd-modal-body">
              {newPatientErrors.submit && (
                <div className="rd-modal-error">{newPatientErrors.submit}</div>
              )}
              {newPatientSuccess && (
                <div className="rd-modal-success">{newPatientSuccess}</div>
              )}

              <PatientFormFields form={newPatientForm} errors={newPatientErrors} onChange={handleNewPatientChange} />

              <div className="rd-modal-footer">
                <button type="button" className="rd-modal-cancel-btn" onClick={closeNewPatientModal}>Cancel</button>
                <button type="submit" className="rd-modal-submit-btn rd-modal-add-btn" disabled={newPatientSubmitting}>
                  {newPatientSubmitting ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Patient Modal ──────────────────────── */}
      {showEditPatientModal && (
        <div className="rd-modal-overlay" onClick={closeEditPatientModal}>
          <div className="rd-modal rd-modal-new-patient" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-header">
              <div>
                <h2 className="rd-modal-title">Edit Patient</h2>
                <p className="rd-modal-subtitle">Update patient information and appointment details.</p>
              </div>
              <button className="rd-modal-close" onClick={closeEditPatientModal}>✕</button>
            </div>
            <form onSubmit={handleEditPatientSubmit} className="rd-modal-body">
              {editPatientErrors.submit && (
                <div className="rd-modal-error">{editPatientErrors.submit}</div>
              )}
              {editPatientSuccess && (
                <div className="rd-modal-success">{editPatientSuccess}</div>
              )}

              <PatientFormFields form={editPatientForm} errors={editPatientErrors} onChange={handleEditPatientChange} />

              <div className="rd-modal-footer">
                <button type="button" className="rd-modal-cancel-btn" onClick={closeEditPatientModal}>Cancel</button>
                <button type="submit" className="rd-modal-submit-btn" disabled={editPatientSubmitting}>
                  {editPatientSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Follow-up Patient Modal ─────────────────── */}
      {showFollowUpModal && (
        <div className="rd-modal-overlay" onClick={closeFollowUpModal}>
          <div className="rd-modal rd-modal-followup" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-header">
              <h2 className="rd-modal-title">Register Follow-up Visit</h2>
              <button className="rd-modal-close" onClick={closeFollowUpModal}>✕</button>
            </div>
            <div className="rd-modal-body">
              {followUpError && <div className="rd-modal-error">{followUpError}</div>}
              {followUpSuccess && <div className="rd-modal-success">{followUpSuccess}</div>}

              <div className="rd-form-group">
                <label className="rd-form-label">Search Existing Patient</label>
                <div className="rd-followup-search-row">
                  <input
                    type="text"
                    className="rd-form-input"
                    placeholder="Search by name or mobile number..."
                    value={followUpSearch}
                    onChange={(e) => setFollowUpSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFollowUpSearch(); } }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="rd-followup-search-btn"
                    onClick={handleFollowUpSearch}
                    disabled={followUpSearching || !followUpSearch.trim()}
                  >
                    {followUpSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {followUpResults.length > 0 && (
                <div className="rd-followup-results">
                  <label className="rd-form-label">Select a patient:</label>
                  <div className="rd-followup-list">
                    {followUpResults.map((p, i) => (
                      <div
                        key={`${p.appointmentId || p.patientId}-${i}`}
                        className={`rd-followup-item ${selectedFollowUpPatient?.appointmentId === p.appointmentId ? 'rd-followup-selected' : ''}`}
                        onClick={() => setSelectedFollowUpPatient(p)}
                      >
                        <div className="rd-followup-item-name">{p.patientName}</div>
                        <div className="rd-followup-item-details">
                          <span>📱 {p.mobileNumber}</span>
                          {p.appointmentDate && <span>📅 {p.appointmentDate}</span>}
                          {p.appointmentTime && <span>🕒 {formatTime12h(p.appointmentTime)}</span>}
                          {p.appointmentStatus && (
                            <span className={`rd-followup-status ${STATUS_CLASS_MAP[p.appointmentStatus] || ''}`}>
                              {STATUS_DISPLAY[p.appointmentStatus] || p.appointmentStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFollowUpPatient && (
                <>
                  <div className="rd-form-row">
                    <div className="rd-form-group rd-form-half">
                      <label className="rd-form-label">Appointment Date <span className="rd-required">*</span></label>
                      <input
                        type="date"
                        className="rd-form-input"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={today}
                      />
                    </div>
                    <div className="rd-form-group rd-form-half">
                      <label className="rd-form-label">Appointment Time <span className="rd-required">*</span></label>
                      <input
                        type="time"
                        className="rd-form-input"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="rd-form-group">
                    <label className="rd-form-label">Notes</label>
                    <textarea
                      className="rd-form-input rd-form-textarea"
                      placeholder="E.g. Post-surgery checkup, medication review..."
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="rd-modal-footer">
                <button type="button" className="rd-modal-cancel-btn" onClick={closeFollowUpModal}>Cancel</button>
                <button
                  type="button"
                  className="rd-modal-submit-btn"
                  disabled={!selectedFollowUpPatient || followUpSubmitting}
                  onClick={handleFollowUpSubmit}
                >
                  {followUpSubmitting ? 'Registering...' : 'Register Follow-up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
