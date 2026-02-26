import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Define API handlers for mocking
export const handlers = [
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

  // Login endpoint
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email && body.password) {
      return HttpResponse.json({
        token: 'fake-jwt-token',
        user: { id: 1, email: body.email, name: 'John Doe' },
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Enable API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Disable API mocking after all tests
afterAll(() => server.close());
