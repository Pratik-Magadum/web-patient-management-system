// API Service for Hospital Management System
const HOSPITAL_API_BASE_URL = import.meta.env.VITE_HOSPITAL_API_BASE_URL || 'http://localhost:9080';

if (import.meta.env.DEV) {
  console.log('🔌 Hospital API Base URL:', HOSPITAL_API_BASE_URL);
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

  const url = `${HOSPITAL_API_BASE_URL}/api/v1/auth/refresh`;
  if (import.meta.env.DEV) {
    console.log('🔄 Refreshing access token...');
  }

  const response = await fetch(url, {
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

  if (import.meta.env.DEV) {
    console.log('✅ Token refreshed successfully');
  }
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
    await authenticatedFetch(`${HOSPITAL_API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (import.meta.env.DEV) {
      console.log('✅ Logged out successfully');
    }
  } catch (error) {
    console.error('❌ Logout API error:', error);
  } finally {
    clearAuthData();
  }
}

export async function getHospitalDetails(subdomain) {
  const url = `${HOSPITAL_API_BASE_URL}/api/v1/hospitals/${subdomain}`;
  if (import.meta.env.DEV) {
    console.log(`📍 Fetching hospital details for: ${subdomain}`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Hospital not found: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  if (import.meta.env.DEV) {
    console.log('✅ Hospital details received:', responseData);
  }

  return {
    success: true,
    data: responseData.data,
    message: responseData.message,
    status: responseData.status,
    timestamp: responseData.timestamp,
  };
}

export async function loginUser(hospitalId, username, password) {
  const url = `${HOSPITAL_API_BASE_URL}/api/v1/auth/login`;
  if (import.meta.env.DEV) {
    console.log(`🔐 Attempting login for: ${username}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospitalId, username, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Login failed: ${response.status}`);
  }

  const { accessToken, refreshToken, expiresIn, role, hospitalId: respHospitalId } = result.data;
  storeAuthData({ accessToken, refreshToken, expiresIn, role, hospitalId: respHospitalId || hospitalId });

  if (import.meta.env.DEV) {
    console.log('✅ Login successful, role:', role);
  }
  return result;
}

/**
 * Search patients by name, phone, and date range.
 * If no params are provided, returns today's patients by default (server behavior).
 */
export async function searchPatients({ fromDate, toDate, page, size } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (page != null) params.append('page', page);
  if (size != null) params.append('size', size);

  const query = params.toString();
  const url = `${HOSPITAL_API_BASE_URL}/api/v1/patients/by-dates${query ? `?${query}` : ''}`;
  if (import.meta.env.DEV) {
    console.log('🔍 Searching patients:', { fromDate, toDate, page, size });
  }

  const response = await authenticatedFetch(url, {
    method: 'GET',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Search failed: ${response.status}`);
  }

  if (import.meta.env.DEV) {
    console.log('✅ Patient search results:', result);
  }
  return result;
}

/**
 * Search patients by name or phone number.
 */
export async function searchPatientsByNamePhone({ name, phonenumber, pageNumber, pageSize } = {}) {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (phonenumber) params.append('phonenumber', phonenumber);
  if (pageNumber != null) params.append('pageNumber', pageNumber);
  if (pageSize != null) params.append('pageSize', pageSize);

  const query = params.toString();
  const url = `${HOSPITAL_API_BASE_URL}/api/v1/patients/search/by-name-phone${query ? `?${query}` : ''}`;
  if (import.meta.env.DEV) {
    console.log('🔍 Searching patients by name/phone:', { name, phonenumber });
  }

  const response = await authenticatedFetch(url, {
    method: 'GET',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Search failed: ${response.status}`);
  }

  if (import.meta.env.DEV) {
    console.log('✅ Patient name/phone search results:', result);
  }
  return result;
}

/**
 * Delete a patient by ID.
 */
export async function deletePatient(patientId) {
  const url = `${HOSPITAL_API_BASE_URL}/api/v1/patients/${encodeURIComponent(patientId)}`;
  if (import.meta.env.DEV) {
    console.log('🗑️ Deleting patient:', patientId);
  }

  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `Delete failed: ${response.status}`);
  }

  if (import.meta.env.DEV) {
    console.log('✅ Patient deleted:', patientId);
  }
}
