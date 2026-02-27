# Build Instructions - Patient Management System (Web)

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Development Workflow](#development-workflow)
3. [Responsive Design Standards](#responsive-design-standards)
4. [Component Development Guide](#component-development-guide)
5. [Testing Guidelines](#testing-guidelines)
6. [API Integration Flow](#api-integration-flow)
7. [Code Quality Standards](#code-quality-standards)

---

## 📌 Project Overview

**Project:** Patient Management System - Frontend Web Service  
**Framework:** React 18 + Vite  
**Testing:** Vitest + React Testing Library + MSW  
**Browser Support:** Modern browsers with responsive design  

### Tech Stack
- **React:** Component library
- **Vite:** Build tool
- **Vitest:** Test runner
- **React Testing Library:** Component testing
- **MSW (Mock Service Worker):** API mocking
- **CSS:** Responsive design with CSS variables

---

## 🚀 Development Workflow

### 1. **Initial Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app runs on http://localhost:5173 (default Vite port)
```

### 2. **Component Development Phases**

#### Phase 1: Static Component Development
```
Your Task:
1. Create component with MOCK/STATIC data (NO API calls)
2. Focus on UI/UX and responsiveness
3. Test with different zoom levels (75%, 100%, 125%, 150%)
4. Verify no CSS issues or layout breaks
5. Verify component renders correctly with static data
⚠️ DO NOT CREATE TEST CASES YET
```

#### Phase 2: API Integration
```
Your Task:
1. Once static version is verified stable
2. Integrate real API endpoints
3. Update components to fetch real data
4. Implement loading, error, and success states
5. Verify API responses match expected format
6. Test manually in browser (Postman/API testing tool)
⚠️ DO NOT CREATE TEST CASES YET
```

#### Phase 3: Integration Testing (After APIs are Integrated)
```
Your Task:
1. Follow TESTING_GUIDE.md patterns
2. Create integration test cases for API scenarios
3. Test loading, success, and error states
4. Mock APIs with MSW in src/setup.js
5. Run: npm test:ui (visual test dashboard)
6. Ensure 80%+ code coverage
```

### 3. **Build & Production**
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📐 Responsive Design Standards

### ⚙️ CSS Architecture

All components MUST follow these responsive design principles:

#### 1. **Mobile-First Approach**
```css
/* Start with mobile styles */
.component {
  width: 100%;
  padding: 1rem;
  font-size: 14px;
}

/* Grow to larger screens */
@media (min-width: 640px) {  /* tablet */
  .component {
    width: 80%;
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) { /* desktop */
  .component {
    width: 70%;
    padding: 2rem;
  }
}
```

#### 2. **Breakpoint Standards**
```css
/* Mobile: < 640px */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */

@media (max-width: 639px) { }      /* Mobile */
@media (min-width: 640px) { }      /* Tablet+ */
@media (min-width: 1024px) { }     /* Desktop */
@media (min-width: 1280px) { }     /* Large Desktop */
```

#### 3. **Zoom-Friendly Font Sizing**
```css
/* Use rem units (responsive to root font-size) */
h1 { font-size: 2rem; }     /* Scales with zoom */
h2 { font-size: 1.5rem; }
p  { font-size: 1rem; }
small { font-size: 0.875rem; }

/* Avoid fixed pixels for main content */
/* Use px only for borders, small decorative elements */
border: 1px solid #000;
```

#### 4. **Flexible Spacing**
```css
/* Use rem/em for consistent scaling */
padding: 1.5rem;            /* ~24px at 16px root */
margin: 1rem;               /* ~16px at 16px root */
gap: 0.5rem;                /* ~8px at 16px root */

/* Responsive padding/margin */
@media (max-width: 639px) {
  .container { padding: 1rem; }
}
@media (min-width: 1024px) {
  .container { padding: 2rem; }
}
```

#### 5. **Viewport Meta Tag** (Already in index.html)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### 6. **Flexible Grid/Flex Layouts**
```css
/* Good: Responsive grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Good: Flexible flexbox */
.flex {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

/* ❌ AVOID: Fixed pixel widths */
.bad { width: 500px; }  /* Won't scale */
```

### ✅ Responsive Design Checklist

- [ ] Uses CSS variables for colors (see src/styles.css)
- [ ] All fonts use rem units for zoom support
- [ ] Spacing (padding/margin) uses rem units
- [ ] Media queries follow breakpoint standards
- [ ] Mobile-first approach implemented
- [ ] Tested at 75%, 100%, 125%, 150% zoom
- [ ] No fixed pixel widths for main containers
- [ ] Flex/Grid layouts used instead of floats
- [ ] Images are responsive (max-width: 100%)
- [ ] Forms are touch-friendly (min 44px tap targets)

---

## 🧩 Component Development Guide

### File Structure
```
src/
├── components/
│   ├── PatientList/
│   │   ├── PatientList.jsx         (Component)
│   │   ├── PatientList.test.jsx    (Tests)
│   │   └── PatientList.css         (Styles)
│   ├── PatientForm/
│   │   ├── PatientForm.jsx
│   │   ├── PatientForm.test.jsx
│   │   └── PatientForm.css
│   └── [YourComponent]/
│       ├── [YourComponent].jsx
│       ├── [YourComponent].test.jsx
│       └── [YourComponent].css
├── App.jsx
├── App.test.jsx
├── setup.js            (MSW API mocks)
├── styles.css          (Global styles)
└── main.jsx            (Entry point)
```

### Step 1: Create Component with Static Data

**File: `src/components/PatientList/PatientList.jsx`**
```jsx
import React from 'react';
import './PatientList.css';

export default function PatientList() {
  // STATIC DATA - Replace with API call later
  const patients = [
    { id: 1, name: 'John Doe', age: 45, status: 'Active' },
    { id: 2, name: 'Jane Smith', age: 32, status: 'Active' },
  ];

  return (
    <div className="patient-list">
      <h2>Patients</h2>
      <table className="patients-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => (
            <tr key={patient.id}>
              <td>{patient.id}</td>
              <td>{patient.name}</td>
              <td>{patient.age}</td>
              <td>{patient.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**File: `src/components/PatientList/PatientList.css`**
```css
.patient-list {
  padding: 1rem;
  max-width: 100%;
}

.patient-list h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--accent);
}

.patients-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card);
  border-radius: 8px;
  overflow: hidden;
}

.patients-table thead {
  background: rgba(125, 211, 252, 0.1);
}

.patients-table th,
.patients-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
  font-size: 1rem;
}

.patients-table th {
  font-weight: 600;
  color: var(--accent);
}

.patients-table tr:hover {
  background: rgba(125, 211, 252, 0.05);
}

/* Responsive: Stack on mobile */
@media (max-width: 639px) {
  .patients-table {
    font-size: 0.875rem;
  }

  .patients-table th,
  .patients-table td {
    padding: 0.75rem;
  }

  .patients-table th:nth-child(n+3),
  .patients-table td:nth-child(n+3) {
    display: none; /* Hide less important columns on mobile */
  }
}
```

### Step 2: Verify Static Component Works

```bash
# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

**Manual Verification Checklist:**
- [ ] Component renders without errors
- [ ] All static data displays correctly
- [ ] No console errors/warnings
- [ ] Zoom to 75% - Check layout
- [ ] Zoom to 100% - Check layout
- [ ] Zoom to 125% - Check layout
- [ ] Zoom to 150% - Check layout
- [ ] Resize browser window (mobile, tablet, desktop)
- [ ] All text is readable at all zoom levels
- [ ] No overflow or layout breaks
- [ ] Tables/lists/forms are usable at all sizes
- [ ] CSS styling matches design standards

**Once verified:** Move to API Integration phase

### Step 3: API Integration

Update your component to fetch from real APIs instead of static data:

**File: `src/components/PatientList/PatientList.jsx` (Updated)**
```jsx
import { useState, useEffect } from 'react';
import './PatientList.css';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/patients');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setPatients(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) return <div className="loading">Loading patients...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="patient-list">
      <h2>Patients</h2>
      {patients.length === 0 ? (
        <p>No patients found</p>
      ) : (
        <table className="patients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.id}</td>
                <td>{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

**Verify API Integration:**
- [ ] Component still renders correctly
- [ ] Data loads from real API
- [ ] Loading state appears while fetching
- [ ] Error state shows if API fails
- [ ] Responsive design still works at all zoom levels
- [ ] No console errors/warnings

**Once verified:** Move to Test Case Generation phase

### Step 4: Test Case Generation (After API Integration)

Now create integration tests for your API-connected component.

**File: `src/components/PatientList/PatientList.test.jsx`**
```jsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientList from './PatientList';

describe('PatientList Component', () => {
  it('should display loading state initially', () => {
    render(<PatientList />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should load and display patients from API', async () => {
    render(<PatientList />);
    
    // Wait for API call to complete and data to appear
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display correct table headers', async () => {
    render(<PatientList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API failure
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API Error'))
    );
    
    render(<PatientList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no patients found', async () => {
    // Mock empty response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );
    
    render(<PatientList />);
    
    await waitFor(() => {
      expect(screen.getByText(/no patients found/i)).toBeInTheDocument();
    });
  });
});
```

**MSW Mock Setup in `src/setup.js`** (Already configured for testing):
```javascript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET /api/patients
  http.get('/api/patients', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', age: 45, status: 'Active' },
      { id: 2, name: 'Jane Smith', age: 32, status: 'Active' },
    ]);
  }),

  // POST /api/patients (if needed)
  http.post('/api/patients', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Run Tests:**
```bash
npm test -- --run          # Run once
npm test                   # Watch mode
npm test:ui                # Visual dashboard
```

---

## 🧪 Integration Testing Guidelines (After API Integration)

**⚠️ Create test cases ONLY AFTER APIs are integrated and working correctly.**

Follow the patterns from `TESTING_GUIDE.md`. Quick reference:

### Integration Test Pattern
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('should load and display data', async () => {
    render(<YourComponent />);
    
    // Wait for API call
    await waitFor(() => {
      expect(screen.getByText(/John/i)).toBeInTheDocument();
    });
  });

  it('should handle user interactions', async () => {
    render(<YourComponent />);
    
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /submit/i });
    
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  it('should display error state', async () => {
    // Test error handling...
  });
});
```

### MSW Mock Setup (src/setup.js)
```javascript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET /api/patients
  http.get('/api/patients', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', age: 45, status: 'Active' },
      { id: 2, name: 'Jane Smith', age: 32, status: 'Active' },
    ]);
  }),

  // POST /api/patients
  http.post('/api/patients', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Test Coverage Goals
- **80%+** statement coverage
- **70%+** branch coverage
- **Test integration scenarios** (multiple components together)
- **Test error states** (API failures, validation errors)
- **Test user interactions** (form submissions, button clicks)

---

## 🔌 API Integration Workflow

### Phase 1: Static Component with Mock Data
1. ✅ Component renders with hardcoded data
2. ✅ No API calls
3. ✅ Responsive design verified at all zoom levels
4. ✅ Manual testing in browser passes

### Phase 2: Integrate Real APIs
1. Replace static data with API fetch calls
2. Add loading state while API call is in progress
3. Add error handling for API failures
4. Add success state when data loads
5. Test manually in browser with real APIs

### Phase 3: Create Integration Tests (After APIs Work)
1. Create MSW mock handlers in `src/setup.js`
2. Write integration tests following TESTING_GUIDE.md
3. Test loading, success, error, and empty states
4. Run tests: `npm test -- --run`
5. Verify 80%+ code coverage

---

**IMPORTANT:** Do NOT create test cases until Phase 2 (API Integration) is complete and working correctly.

---

## ✅ Code Quality Standards

### 1. **Code Style**
- Use PascalCase for React components: `PatientList.jsx`
- Use camelCase for variables/functions: `fetchPatients()`
- Use UPPERCASE for constants: `API_BASE_URL`

### 2. **Component Best Practices**
```jsx
// ✅ GOOD: Clear, focused component
export default function PatientList() {
  const [patients, setPatients] = useState([]);
  // ...
  return <div>{/* JSX */}</div>;
}

// ❌ BAD: Too much logic, hard to test
export default function Dashboard() {
  // 50 lines of logic...
  // mixing multiple concerns...
}
```

### 3. **Avoid Dead Code**
- Delete unused imports
- Delete commented-out code before committing
- Use linting to catch unused variables

### 4. **Readable Variable Names**
```jsx
// ✅ GOOD
const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

// ❌ BAD
const [a, setA] = useState(false);
const [x, setX] = useState('');
```

### 5. **PropTypes or TypeScript** (Optional but Recommended)
```jsx
import PropTypes from 'prop-types';

function PatientCard({ patient }) {
  return <div>{patient.name}</div>;
}

PatientCard.propTypes = {
  patient: PropTypes.shape({
    id: PropTypes.number.required,
    name: PropTypes.string.required,
  }).isRequired,
};
```

### 6. **Error Handling**
```jsx
// ✅ GOOD: Always have error handling
try {
  const response = await fetch('/api/patients');
  if (!response.ok) throw new Error('Failed to load patients');
  // ...
} catch (error) {
  console.error('Error:', error);
  setError(error.message);
}

// ❌ BAD: No error handling
const data = await fetch('/api/patients').then(r => r.json());
```

### 7. **Comments - When Needed**
```jsx
// ✅ GOOD: Explain WHY, not WHAT
// Fetch patients on component mount and when status filter changes
useEffect(() => {
  // ...
}, [statusFilter]);

// ❌ BAD: Obvious comments clutter code
// Set loading to true
setLoading(true);
```

### 8. **Console Logs**
```jsx
// ✅ Remove before committing
// Development only:
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// ❌ BAD: Left in production code
console.log('test');
console.log('todo: fix this later');
```

### 9. **File Organization**
```
Each component folder should contain:
├── ComponentName.jsx       (Component logic)
├── ComponentName.css       (Component styles)
├── ComponentName.test.jsx  (Component tests)
└── index.js               (Optional: export statement)
```

### 10. **Imports Organization**
```jsx
// ✅ GOOD: Organized imports
import React, { useState, useEffect } from 'react';
import './PatientList.css';
import PatientCard from '../PatientCard/PatientCard';

// ❌ BAD: Random order
import './PatientList.css';
import React from 'react';
import PatientCard from '../PatientCard/PatientCard';
import { useState } from 'react';
```

---

## 🎯 Development Checklist

### Phase 1: Static Component Development
- [ ] **Component Creation**
  - [ ] Component renders correctly with static data
  - [ ] No console errors/warnings
  - [ ] Responsive at all zoom levels (75%, 100%, 125%, 150%)
  - [ ] Mobile/tablet/desktop layouts work
  - [ ] CSS uses rem for fonts/spacing
  - [ ] No fixed pixel widths for containers

- [ ] **Code Quality**
  - [ ] No dead code (unused imports, variables)
  - [ ] No console.log statements
  - [ ] Readable variable names
  - [ ] Comments only where necessary
  - [ ] Error handling included (if applicable)

### Phase 2: API Integration  
- [ ] **API Integration**
  - [ ] Real API endpoints integrated
  - [ ] Component still renders correctly
  - [ ] Data loads from real API
  - [ ] Loading state displays while fetching
  - [ ] Error state shows if API fails
  - [ ] Responsive design still works at all zoom levels
  - [ ] Manual testing in browser passes
  - [ ] API response format verified

### Phase 3: Test Case Generation (After APIs Work)
- [ ] **Integration Tests**
  - [ ] Tests cover loading state
  - [ ] Tests cover success scenario
  - [ ] Tests cover error scenarios
  - [ ] Tests cover empty data scenario
  - [ ] MSW mocks match real API responses
  - [ ] All tests pass: `npm test -- --run`
  - [ ] Test coverage: 80%+ statements, 70%+ branches
  - [ ] No snapshot tests (unless required)

- [ ] **Final Review**
  - [ ] No dead code
  - [ ] No console.log statements left
  - [ ] Code follows standards in CODE_QUALITY_STANDARDS section
  - [ ] Ready for code review

---

## � Responsive Card & Modal Guidelines

### ⚠️ Common Scrolling & Sizing Issues

When building card/modal components, follow these guidelines to prevent content overflow and sizing issues:

#### Issue 1: Card Too Large at 100% Zoom
**Problem:** Card takes up too much space and looks oversized on desktop screens.

**Solution:**
```css
.card {
  max-width: 500px;        /* ✅ Set reasonable max-width */
  width: 100%;             /* ✅ Responsive on mobile */
  padding: 32px 28px;      /* ✅ Balanced padding (not 40px+) */
  margin: auto;            /* ✅ Center the card */
}
```

#### Issue 2: Content Overflow on Small Screens
**Problem:** Card content overflows viewport, requires zooming out to view entire card.

**Solution:**
```css
.card {
  max-height: 85vh;        /* ✅ Allow scrolling when needed */
  overflow-y: auto;        /* ✅ Vertical scroll for content */
  overflow-x: hidden;      /* ✅ Prevent horizontal scroll */
}
```

#### Issue 3: Font & Spacing Too Large
**Problem:** Font sizes and padding are too large, making card feel bloated.

**Guidelines:**
```css
/* ✅ CORRECT: Proportional sizing */
.card-header h1 {
  font-size: 24px;         /* Desktop readable, mobile friendly */
  margin: 8px 0 5px 0;     /* Tighter margins */
}

.form-label {
  font-size: 12px;         /* Reduced from 14px */
}

.form-input {
  padding: 10px 12px;      /* Reduced from 12px 14px */
  font-size: 13px;         /* Reduced from 14px */
}

.card {
  padding: 32px 28px;      /* Reduced from 40px */
}

.section {
  margin-bottom: 20px;     /* Reduced from 30px */
  gap: 14px;               /* Reduced from 18px */
}

/* ❌ AVOID: Excessive spacing */
.bad-padding { padding: 40px + !important; }
.bad-margin { margin: 35px 0; }
```

#### Issue 4: Custom Scrollbar Styling
**Problem:** Default scrollbar doesn't match design, or scrollbar doesn't appear when needed.

**Solution:**
```css
/* Webkit browsers (Chrome, Safari, Edge) */
.scrollable-card::-webkit-scrollbar {
  width: 8px;              /* Slim scrollbar */
}

.scrollable-card::-webkit-scrollbar-track {
  background: #f5f5f5;     /* Light background */
  border-radius: 10px;
}

.scrollable-card::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
}

.scrollable-card::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

/* Firefox */
.scrollable-card {
  scrollbar-width: thin;
  scrollbar-color: #667eea #f5f5f5;
}
```

### ✅ Card Development Checklist

- [ ] `max-width` set appropriately (380px-500px for content cards)
- [ ] `width: 100%` for mobile responsiveness
- [ ] `max-height: 85vh` + `overflow-y: auto` for scrollable content
- [ ] Font sizes: h1=24px, labels=12px, inputs=13px, body=14px
- [ ] Padding: 32px 28px (or proportional)
- [ ] All spacing (margin/gap) uses rem units or appropriate px values
- [ ] Custom scrollbar styled for dark/light themes
- [ ] Tested at 50%, 75%, 100%, 125%, 150% zoom levels
- [ ] Content readable without zooming in
- [ ] No horizontal scrolling required
- [ ] Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px) all tested

### Real-World Example

**File: `src/styles/login.css`** (Reference Implementation)
```css
.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 380px;        /* ✅ Reasonable max-width */
  padding: 32px 28px;      /* ✅ Balanced padding */
  animation: slideDown 0.3s ease;
}

.form-group label {
  font-size: 12px;         /* ✅ Appropriate label size */
  font-weight: 600;
  color: #333;
}

.form-group input {
  padding: 10px 12px;      /* ✅ Touch-friendly but not oversized */
  border: 1px solid #ddd;
  font-size: 13px;         /* ✅ Mobile-friendly font size */
}

.btn-signin {
  padding: 10px 14px;      /* ✅ Proportional button padding */
  font-size: 13px;         /* ✅ Consistent with form */
  margin-top: 8px;
}

.demo-credentials {
  padding: 16px;           /* ✅ Reduced from 20px */
  margin-top: 16px;        /* ✅ Tighter spacing */
}
```

**File: `src/styles/notregistered.css`** (Reference Implementation)
```css
.notregistered-card {
  width: 100%;
  max-width: 500px;        /* ✅ Larger for content-heavy card */
  max-height: 85vh;        /* ✅ Scrollable on small viewports */
  padding: 35px 32px;      /* ✅ Balanced padding */
  overflow-y: auto;        /* ✅ Enable vertical scrolling */
  overflow-x: hidden;      /* ✅ No horizontal scroll */
}

/* Custom scrollbar for the card */
.notregistered-card::-webkit-scrollbar {
  width: 8px;
}

.notregistered-card::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 10px;
}

.notregistered-card::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
}
```

---

## �📞 Quick Reference

### Common Commands
```bash
npm run dev          # Start development server
npm test             # Run tests in watch mode
npm test -- --run   # Run tests once
npm test:ui          # Visual test dashboard
npm run build        # Build for production
npm run preview      # Preview production build
```

### Project Structure
```
src/
├── components/         ← Your components here
├── App.jsx            ← Main app component
├── App.test.jsx       ← App tests
├── setup.js           ← MSW mock handlers
├── styles.css         ← Global styles
└── main.jsx           ← Entry point
```

### Key Files
- `package.json` - Dependencies & scripts
- `vite.config.js` - Build configuration
- `vitest.config.js` - Test configuration
- `TESTING_GUIDE.md` - Detailed testing patterns
- `BUILD_INSTRUCTIONS.md` - This file

---

## 🤝 Need Help?

Refer to:
1. **TESTING_GUIDE.md** - For testing patterns
2. **src/App.jsx** - Component example
3. **src/styles.css** - CSS variable reference
4. **Vite Docs** - https://vitejs.dev
5. **React Testing Library Docs** - https://testing-library.com
6. **MSW Docs** - https://mswjs.io

---

**Last Updated:** February 27, 2026  
**Version:** 1.0
