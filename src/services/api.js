// API Service for Hospital Management System
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const HOSPITAL_API_BASE_URL = import.meta.env.VITE_HOSPITAL_API_BASE_URL || 'http://localhost:9080';

if (import.meta.env.DEV) {
  console.log('🔌 API Base URL:', API_BASE_URL);
  console.log('🔌 Hospital API Base URL:', HOSPITAL_API_BASE_URL);
}

export async function getHospitalDetails(subdomain) {
  try {
    if (import.meta.env.DEV) {
      console.log(`📍 Fetching hospital details for subdomain: ${subdomain}`);
    }
    
    const url = `${HOSPITAL_API_BASE_URL}/api/v1/hospitals/${subdomain}`;
    if (import.meta.env.DEV) {
      console.log('🌐 Request URL:', url);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
  } catch (error) {
    console.error('❌ Error fetching hospital details:', error);
    throw error;
  }
}

/**
 * Get hospital details by name
 * @param {string} hospitalName - The name/code of the hospital
 * @returns {Promise} Hospital details including registration status
 */
export async function getHospital(hospitalName) {
  try {
    if (import.meta.env.DEV) {
      console.log(`📍 Fetching hospital: ${hospitalName}`);
    }
    
    const url = `${API_BASE_URL}/hospitals/${hospitalName}`;
    if (import.meta.env.DEV) {
      console.log('🌐 Request URL:', url);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Hospital-Name': hospitalName,
      },
    });

    if (!response.ok) {
      throw new Error(`Hospital not found: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log('✅ Hospital data received:', data);
    }
    return data;
  } catch (error) {
    console.error('❌ Error fetching hospital:', error);
    throw error;
  }
}

/**
 * Login user with credentials
 * @param {string} hospitalName - Hospital identifier
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} Auth token and user details
 */
export async function loginUser(hospitalName, username, password) {
  try {
    if (import.meta.env.DEV) {
      console.log(`🔐 Attempting login for: ${username} at hospital: ${hospitalName}`);
    }
    
    const url = `${API_BASE_URL}/auth/login`;
    if (import.meta.env.DEV) {
      console.log('🌐 Request URL:', url);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hospital-Name': hospitalName,
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log('✅ Login successful:', data.user);
    }
    return data;
  } catch (error) {
    console.error('❌ Error during login:', error);
    throw error;
  }
}
