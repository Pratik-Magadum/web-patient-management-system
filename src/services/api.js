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

/**
 * Fetch today's dashboard stats for stat cards.
 */
export async function getDashboardStats() {
  const url = `${HOSPITAL_API_BASE_URL}/api/v1/patients/dashboard/today`;
  if (import.meta.env.DEV) {
    console.log('📊 Fetching dashboard stats...');
  }

  const response = await authenticatedFetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
  }

  const data = await response.json();
  if (import.meta.env.DEV) {
    console.log('✅ Dashboard stats received:', data);
  }
  return data;
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
