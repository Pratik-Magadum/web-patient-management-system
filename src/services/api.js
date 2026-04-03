// API Service for Hospital Management System
const HOSPITAL_API_BASE_URL = import.meta.env.VITE_HOSPITAL_API_BASE_URL || 'http://localhost:9080';
const IS_DEV = import.meta.env.DEV;

if (IS_DEV) {
  console.log('🔌 Hospital API Base URL:', HOSPITAL_API_BASE_URL);
}

// ─── Helpers ────────────────────────────────────────────────────────

function apiUrl(path) {
  return `${HOSPITAL_API_BASE_URL}${path}`;
}

function buildQuery(params) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== '') qs.append(key, val);
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

function devLog(emoji, message, data) {
  if (IS_DEV) console.log(`${emoji} ${message}`, data ?? '');
}

async function parseJsonResponse(response, errorPrefix) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `${errorPrefix}: ${response.status}`);
  }
  return result;
}

async function parseEmptyResponse(response, errorPrefix) {
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `${errorPrefix}: ${response.status}`);
  }
}

// ─── Token Management ───────────────────────────────────────────────

const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRY: 'tokenExpiry',
  ROLE: 'userRole',
  HOSPITAL_ID: 'hospitalId',
  HOSPITAL_NAME: 'hospitalName',
};

export function storeAuthData({ accessToken, refreshToken, expiresIn, role, hospitalId, hospitalName }) {
  localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(AUTH_KEYS.TOKEN_EXPIRY, String(Date.now() + expiresIn));
  localStorage.setItem(AUTH_KEYS.ROLE, role);
  localStorage.setItem(AUTH_KEYS.HOSPITAL_ID, hospitalId);
  if (hospitalName) localStorage.setItem(AUTH_KEYS.HOSPITAL_NAME, hospitalName);
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken() {
  return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
}

export function getUserRole() {
  return localStorage.getItem(AUTH_KEYS.ROLE);
}

export function isTokenExpired() {
  const expiry = localStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  return Date.now() >= Number(expiry);
}

export function clearAuthData() {
  Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
}

/**
 * Refresh the access token using the stored refresh token.
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  devLog('🔄', 'Refreshing access token...');
  const response = await fetch(apiUrl('/api/v1/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthData();
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Session expired. Please login again.');
  }

  const result = await response.json();
  const { accessToken, refreshToken: newRefreshToken, expiresIn, role, hospitalId } = result.data;

  storeAuthData({
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
    role,
    hospitalId,
    hospitalName: localStorage.getItem(AUTH_KEYS.HOSPITAL_NAME),
  });

  devLog('✅', 'Token refreshed successfully');
  return accessToken;
}

/**
 * Wrapper around fetch that automatically attaches the Bearer token
 * and handles token refresh when the token is expired.
 */
export async function authenticatedFetch(url, options = {}) {
  let token = getAccessToken();

  // If token is expired, try refreshing before making the request
  if (isTokenExpired()) {
    try {
      token = await refreshAccessToken();
    } catch {
      clearAuthData();
      window.location.href = '/';
      throw new Error('Session expired. Please login again.');
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If we get 401, try one token refresh
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      headers.Authorization = `Bearer ${token}`;
      response = await fetch(url, { ...options, headers });
    } catch {
      clearAuthData();
      window.location.href = '/';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

/**
 * Logout user by invalidating the refresh token on the server.
 */
export async function logoutUser() {
  const refreshToken = getRefreshToken();
  try {
    await authenticatedFetch(apiUrl('/api/v1/auth/logout'), {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    devLog('✅', 'Logged out successfully');
  } catch (error) {
    console.error('❌ Logout API error:', error);
  } finally {
    clearAuthData();
  }
}

export async function getHospitalDetails(subdomain) {
  devLog('📍', `Fetching hospital details for: ${subdomain}`);
  const response = await fetch(apiUrl(`/api/v1/hospitals/${subdomain}`), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Hospital not found: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  devLog('✅', 'Hospital details received:', responseData);

  return {
    success: true,
    data: responseData.data,
    message: responseData.message,
    status: responseData.status,
    timestamp: responseData.timestamp,
  };
}

export async function loginUser(hospitalId, username, password) {
  devLog('🔐', `Attempting login for: ${username}`);
  const response = await fetch(apiUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospitalId, username, password }),
  });

  const result = await parseJsonResponse(response, 'Login failed');
  const { accessToken, refreshToken, expiresIn, role, hospitalId: respHospitalId } = result.data;
  storeAuthData({ accessToken, refreshToken, expiresIn, role, hospitalId: respHospitalId || hospitalId });

  devLog('✅', 'Login successful, role:', role);
  return result;
}

/**
 * Search patients by date range with optional filters.
 */
export async function searchPatients({ fromDate, toDate, patientStatus, visitType, page, size } = {}) {
  const query = buildQuery({ fromDate, toDate, patientStatus, visitType, page, size });
  devLog('🔍', 'Searching patients:', { fromDate, toDate, patientStatus, visitType, page, size });

  const response = await authenticatedFetch(apiUrl(`/api/v1/patients/by-dates${query}`), { method: 'GET' });
  const result = await parseJsonResponse(response, 'Search failed');

  devLog('✅', 'Patient search results:', result);
  return result;
}

/**
 * Search patients by name or phone number.
 */
export async function searchPatientsByNamePhone({ name, phonenumber, patientStatus, pageNumber, pageSize } = {}) {
  const query = buildQuery({ name, phonenumber, patientStatus, pageNumber, pageSize });
  devLog('🔍', 'Searching patients by name/phone:', { name, phonenumber });

  const response = await authenticatedFetch(apiUrl(`/api/v1/patients/search/by-name-phone${query}`), { method: 'GET' });
  const result = await parseJsonResponse(response, 'Search failed');

  devLog('✅', 'Patient name/phone search results:', result);
  return result;
}

/**
 * Delete an appointment by ID.
 */
export async function deleteAppointment(appointmentId) {
  devLog('🗑️', 'Deleting appointment:', appointmentId);
  const response = await authenticatedFetch(apiUrl(`/api/v1/appointments/${encodeURIComponent(appointmentId)}`), { method: 'DELETE' });
  await parseEmptyResponse(response, 'Delete failed');
  devLog('✅', 'Appointment deleted:', appointmentId);
}

/**
 * Register a new patient.
 */
export async function registerNewPatient(patientData) {
  devLog('➕', 'Registering new patient:', patientData);
  const response = await authenticatedFetch(apiUrl('/api/v1/appointments/register'), {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
  const result = await parseJsonResponse(response, 'Registration failed');
  devLog('✅', 'Patient registered:', result);
  return result;
}

/**
 * Register a follow-up appointment.
 */
export async function registerFollowUpPatient({ parentAppointmentId, appointmentDate, appointmentTime, notes }) {
  const body = { parentAppointmentId, appointmentDate, appointmentTime };
  if (notes) body.notes = notes;

  devLog('🔄', 'Registering follow-up:', body);
  const response = await authenticatedFetch(apiUrl('/api/v1/appointments/follow-up'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const result = await parseJsonResponse(response, 'Follow-up registration failed');
  devLog('✅', 'Follow-up registered:', result);
  return result;
}

/**
 * Edit/update a patient.
 */
export async function editPatient(patientId, patientData) {
  devLog('✏️', 'Editing patient:', { patientId, ...patientData });
  const response = await authenticatedFetch(apiUrl(`/api/v1/patients/${encodeURIComponent(patientId)}`), {
    method: 'PUT',
    body: JSON.stringify(patientData),
  });
  const result = await parseJsonResponse(response, 'Update failed');
  devLog('✅', 'Patient updated:', result);
  return result;
}

/**
 * Update appointment status.
 */
export async function updateAppointmentStatus(appointmentId, status) {
  devLog('🔄', 'Updating appointment status:', { appointmentId, status });
  const query = buildQuery({ status });
  const response = await authenticatedFetch(apiUrl(`/api/v1/appointments/${encodeURIComponent(appointmentId)}/status${query}`), {
    method: 'PATCH',
  });
  const result = await parseJsonResponse(response, 'Status update failed');
  devLog('✅', 'Appointment status updated:', result);
  return result;
}
