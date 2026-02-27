// API Service for Hospital Management System
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

console.log('🔌 API Base URL:', API_BASE_URL);

// Mock data for fallback (when API is not available)
const MOCK_HOSPITALS = {
  'eye-hospital': {
    id: 1,
    code: 'eye-hospital',
    name: 'Eye Hospital Management',
    description: 'Leading eye care center',
    registered: true,
    demoCredentials: [
      {
        role: 'Receptionist',
        username: 'receptionist',
        password: 'reception123',
      },
      {
        role: 'Doctor Assistant',
        username: 'assistant',
        password: 'assistant123',
      },
      {
        role: 'Doctor',
        username: 'doctor',
        password: 'doctor123',
      },
    ],
  },
  'city-hospital': {
    id: 2,
    code: 'city-hospital',
    name: 'City Hospital',
    description: 'Multi-specialty hospital',
    registered: true,
    demoCredentials: [
      {
        role: 'Admin',
        username: 'admin',
        password: 'admin123',
      },
    ],
  },
  'general-hospital': {
    id: 3,
    code: 'general-hospital',
    name: 'General Hospital',
    description: 'General healthcare provider',
    registered: false,
  },
  'community-hospital': {
    id: 4,
    code: 'community-hospital',
    name: 'Community Hospital',
    description: 'Community healthcare center',
    registered: false,
  },
};

/**
 * Get hospital details by name
 * @param {string} hospitalName - The name/code of the hospital
 * @returns {Promise} Hospital details including registration status
 */
export async function getHospital(hospitalName) {
  try {
    console.log(`📍 Fetching hospital: ${hospitalName}`);
    
    const url = `${API_BASE_URL}/hospitals/${hospitalName}`;
    console.log('🌐 Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Hospital-Name': hospitalName,
      },
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Hospital not found: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Hospital data received:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching hospital:', error);
    
    // Fallback to mock data
    console.log('🔄 Using fallback mock data...');
    if (MOCK_HOSPITALS[hospitalName]) {
      console.log('✅ Mock hospital data found for:', hospitalName);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_HOSPITALS[hospitalName];
    }
    
    // Return unregistered hospital response for unknown hospitals
    console.log('⚠️  Hospital not found in mock data, returning unregistered response');
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      code: hospitalName,
      name: hospitalName,
      registered: false,
      error: 'Hospital not found in system',
    };
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
    console.log(`🔐 Attempting login for: ${username} at hospital: ${hospitalName}`);
    
    const url = `${API_BASE_URL}/auth/login`;
    console.log('🌐 Request URL:', url);
    
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

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login successful:', data.user);
    return data;
  } catch (error) {
    console.error('❌ Error during login:', error);
    
    // Fallback: validate against mock credentials
    console.log('🔄 Using fallback mock authentication...');
    const validCredentials = {
      receptionist: { password: 'reception123', role: 'receptionist', name: 'Receptionist' },
      assistant: { password: 'assistant123', role: 'assistant', name: 'Doctor Assistant' },
      doctor: { password: 'doctor123', role: 'doctor', name: 'Doctor' },
      admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
    };

    const credential = validCredentials[username];
    
    if (!credential || credential.password !== password) {
      throw new Error('Invalid username or password');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: Math.random().toString(36).substr(2, 9),
        username,
        role: credential.role,
        name: credential.name,
        hospital: hospitalName,
      },
    };
    
    console.log('✅ Mock login successful:', mockResponse.user);
    return mockResponse;
  }
}
