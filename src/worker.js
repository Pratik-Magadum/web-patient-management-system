import { http, HttpResponse, setupWorker } from 'msw/browser';

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
