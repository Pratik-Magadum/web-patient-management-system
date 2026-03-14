import { setupWorker, http, HttpResponse } from 'msw/browser';

console.log('🔧 Setting up MSW (Mock Service Worker) for browser...');

// Define API handlers for browser (non-testing environment)
const handlers = [
  // Hospital endpoints
  http.get('/api/hospitals/:hospitalName', ({ params }) => {
    const hospitalName = params.hospitalName;
    
    const hospitals = {
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

    const hospital = hospitals[hospitalName];
    if (!hospital) {
      return HttpResponse.json(
        { 
          code: hospitalName,
          name: hospitalName,
          registered: false,
          error: 'Hospital not found in system' 
        }
      );
    }

    return HttpResponse.json(hospital);
  }),

  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const hospitalHeader = request.headers.get('X-Hospital-Name');
    const { username, password } = body;

    const validCredentials = {
      receptionist: { password: 'reception123', role: 'receptionist', name: 'Receptionist' },
      assistant: { password: 'assistant123', role: 'assistant', name: 'Doctor Assistant' },
      doctor: { password: 'doctor123', role: 'doctor', name: 'Doctor' },
      admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
    };

    const credential = validCredentials[username];
    
    if (!credential || credential.password !== password) {
      return HttpResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: Math.random().toString(36).substr(2, 9),
        username,
        role: credential.role,
        name: credential.name,
        hospital: hospitalHeader,
      },
    });
  }),
];

// Create and export the MSW worker
export const worker = setupWorker(...handlers);

// Start the worker with error handling
export async function startMSW() {
  try {
    console.log('▶️  Starting MSW Worker...');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('✅ MSW Worker started successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to start MSW Worker:', error);
    console.log('💡 Using fallback mock data (no service worker interception)');
    return false;
  }
}
