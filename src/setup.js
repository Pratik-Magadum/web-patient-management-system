import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Define API handlers for mocking
export const handlers = [
  // Hospital endpoints
  http.get('/api/hospitals/:hospitalName', ({ params }) => {
    const hospitalName = params.hospitalName;
    
    // Mock different hospitals
    const hospitals = {
      'eye-hospital': {
        id: 1,
        code: 'eye-hospital',
        name: 'Eye Hospital Management',
        description: 'Leading eye care center',
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
        demoCredentials: [
          {
            role: 'Admin',
            username: 'admin',
            password: 'admin123',
          },
        ],
      },
    };

    const hospital = hospitals[hospitalName];
    if (!hospital) {
      return HttpResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(hospital);
  }),

  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const hospitalHeader = request.headers.get('X-Hospital-Name');
    const { username, password } = body;

    // Mock authentication
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
        id: Math.random(),
        username,
        role: credential.role,
        name: credential.name,
        hospital: hospitalHeader,
      },
    });
  }),

  // Patient endpoints
  http.get('/api/patients', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, disease: 'Diabetes' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, disease: 'Hypertension' },
    ]);
  }),

  http.get('/api/patients/:id', ({ params }) => {
    return HttpResponse.json({
      id: parseInt(params.id),
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      disease: 'Diabetes',
      lastAppointment: '2025-12-15',
    });
  }),

  http.post('/api/patients', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 3, ...body, createdAt: new Date().toISOString() },
      { status: 201 }
    );
  }),

  http.put('/api/patients/:id', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: parseInt(params.id),
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/patients/:id', ({ params }) => {
    return HttpResponse.json({ success: true, deleted: parseInt(params.id) });
  }),

  // Appointments endpoints
  http.get('/api/appointments', () => {
    return HttpResponse.json([
      { id: 1, patientId: 1, date: '2025-12-20', time: '10:00', doctor: 'Dr. Smith' },
      { id: 2, patientId: 1, date: '2025-12-27', time: '14:00', doctor: 'Dr. Brown' },
    ]);
  }),

  http.post('/api/appointments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 3, ...body, createdAt: new Date().toISOString() },
      { status: 201 }
    );
  }),
];

// Setup MSW server for testing
export const server = setupServer(...handlers);

// Enable API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Disable API mocking after all tests
afterAll(() => server.close());

