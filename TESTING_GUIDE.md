# Integration Testing Guide - Patient Management System

> This guide documents the full testing setup and best practices for writing integration tests in the Patient Management System.

---

## 📋 Testing Context & Philosophy

### Key Discussion Points:
1. **Integration Tests are Best** (80% focus)
   - Test from user's perspective, not implementation details
   - Test multiple components working together
   - Use React Testing Library (already set up)
   - Mock APIs with MSW - never call real APIs

2. **Unit Tests are Secondary** (20% focus)
   - Test individual utility functions
   - Test pure functions
   - Test custom hooks in isolation

3. **Test Types to Avoid**
   - Snapshot tests (brittle, hard to maintain)
   - Implementation-focused tests

---

## 🔧 Technologies Used

| Tool | Purpose | Docs |
|------|---------|------|
| **Vitest** | Test framework (Vite-native) | Fast, modern |
| **React Testing Library** | Component testing | Tests user perspective |
| **MSW (Mock Service Worker)** | Mock APIs | Realistic API testing |
| **userEvent** | Simulate user interactions | More realistic than fireEvent |
| **@testing-library/jest-dom** | Custom matchers | Enhanced assertions |

---

## 📦 Setup Files Reference

```
src/
├── App.jsx              ← Your actual components here
├── App.test.jsx         ← Tests for App.jsx
└── setup.js             ← MSW handlers (API mocks)

vitest.config.js         ← Test configuration
package.json             ← Test scripts
```

---

## 🚀 Common Commands

```bash
npm test              # Run tests in watch mode
npm test -- --run     # Run tests once
npm test:ui           # Open visual test dashboard
```

---

## ✍️ Integration Test Pattern

### Structure:
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YourComponent from '../YourComponent';

describe('Component Name', () => {
  it('should do something', async () => {
    // 1. RENDER component
    render(<YourComponent />);

    // 2. USER INTERACTIONS (if needed)
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), 'John');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // 3. WAIT for async operations
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎯 Common Testing Scenarios

### 1. Loading State
```javascript
it('should display loading while fetching data', async () => {
  render(<PatientList />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 2. Form Submission
```javascript
it('should submit form and show success', async () => {
  const user = userEvent.setup();
  render(<PatientRegistration />);
  
  await user.type(screen.getByLabelText(/name/i), 'Alice');
  await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
  await user.click(screen.getByRole('button', { name: /register/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### 3. Form Validation
```javascript
it('should show validation errors', async () => {
  const user = userEvent.setup();
  render(<PatientRegistration />);
  
  await user.click(screen.getByRole('button', { name: /register/i }));
  
  expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

### 4. Error Handling
```javascript
it('should handle API errors gracefully', async () => {
  render(<PatientList />);
  
  await waitFor(() => {
    expect(screen.getByText(/error loading patients/i)).toBeInTheDocument();
  });
});
```

### 5. Conditional Rendering
```javascript
it('should show delete confirmation modal', async () => {
  const user = userEvent.setup();
  render(<PatientCard />);
  
  await user.click(screen.getByRole('button', { name: /delete/i }));
  expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
});
```

### 6. API Call Verification
```javascript
it('should fetch from correct API endpoint', async () => {
  render(<PatientList />);
  
  // MSW automatically intercepts and mocks the call
  // No actual API request is made
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

---

## 🎨 Query Priorities (Best to Worst)

Use queries in this order:

### ✅ Preferred (User-visible)
```javascript
screen.getByRole('button', { name: /submit/i })        // Semantic HTML
screen.getByLabelText(/email/i)                        // Form inputs
screen.getByText(/welcome/i)                           // Text content
screen.getByPlaceholderText(/search/i)                 // Placeholder
```

### ⚠️ Use Sparingly (Implementation-dependent)
```javascript
screen.getByTestId('patient-card')                     // Last resort
```

### ❌ Avoid
```javascript
screen.getByClass('button')                            // CSS-focused
```

---

## 🔍 Useful Matchers

```javascript
// Existence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Values
expect(input).toHaveValue('John');
expect(input).toHaveValue('');

// Attributes
expect(button).toBeDisabled();
expect(button).toBeEnabled();
expect(button).toHaveAttribute('aria-label', 'Close');

// Text
expect(element).toHaveTextContent('Submit');
expect(element).toHaveClass('active');

// Form elements
expect(checkbox).toBeChecked();
expect(select).toHaveDisplayValue('Option 1');
```

---

## 📝 Best Practices

### ✅ DO:
- Test user workflows end-to-end
- Test from a user's perspective
- Wait for async operations with `waitFor()`
- Use semantic queries (getByRole, getByLabelText)
- Test error states and edge cases
- Keep tests focused (one behavior per test)

### ❌ DON'T:
- Call real APIs - always use MSW mocks
- Test implementation details
- Use `screen.debug()` in final tests
- Write tests after bugs are found (write first!)
- Test CSS/styling (that's E2E testing)
- Use `fireEvent` instead of `userEvent`

---

## 🔗 API Mocking with MSW

All API endpoints are mocked in [src/setup.js](src/setup.js):

### Current Mocked Endpoints:
```
GET    /api/patients              → List all patients
GET    /api/patients/:id          → Get single patient
POST   /api/patients              → Create patient
PUT    /api/patients/:id          → Update patient
DELETE /api/patients/:id          → Delete patient
GET    /api/appointments          → List appointments
POST   /api/appointments          → Book appointment
POST   /api/auth/login            → User login
```

### Adding New API Endpoints:

Edit [src/setup.js](src/setup.js) and add:
```javascript
http.post('/api/new-endpoint', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ success: true, data: body });
}),
```

---

## 🛠️ Workflow When Building Components

### Step 1: Build Component in App.jsx
```javascript
export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {loading ? <div>Loading...</div> : patients.map(p => <li>{p.name}</li>)}
    </div>
  );
}
```

### Step 2: Write Tests in App.test.jsx
```javascript
import App from './App';

it('should display patient list', async () => {
  render(<App />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Step 3: Run Tests
```bash
npm test
```

### Step 4: Fix Component if Tests Fail
Tests guide you to fix bugs before users see them!

---

## 📊 Recommended Test Coverage

For **Patient Management System**:

| Feature | Tests | Type |
|---------|-------|------|
| Patient List | 3-4 | Integration |
| Patient Registration | 4-5 | Integration |
| Patient Update | 2-3 | Integration |
| Patient Delete | 2-3 | Integration |
| Login/Auth | 2-3 | Integration |
| Appointments | 2-3 | Integration |
| **Total** | **15-21** | - |

**Target: 80% integration + 20% unit tests**

---

## 🚨 Debugging Failed Tests

### Check Loading State
```javascript
// See what's currently rendered
screen.debug();
```

### Wait Longer for Async
```javascript
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
}, { timeout: 3000 });  // 3 second timeout
```

### Check if Text is Split Across Elements
```javascript
// Instead of exact match
expect(screen.getByText(/success/i)).toBeInTheDocument();

// Or use function matcher
screen.getByText((content, element) => 
  content.startsWith('Registration')
);
```

---

## 📚 Quick Reference

| Need | Solution |
|------|----------|
| Render component | `render(<Component />)` |
| Find element | `screen.getByRole()`, `getByLabelText()` |
| Simulate click | `await userEvent.click(element)` |
| Type in input | `await userEvent.type(input, 'text')` |
| Wait for async | `await waitFor(() => {...})` |
| Assert visibility | `expect(element).toBeInTheDocument()` |
| Check value | `expect(input).toHaveValue('value')` |

---

## 🎓 Learning Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev)
- [MSW Documentation](https://mswjs.io)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 📝 Test Template

Copy and use this template for new test files:

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    await user.click(screen.getByRole('button', { name: /action/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/result/i)).toBeInTheDocument();
    });
  });

  it('should handle errors', async () => {
    render(<YourComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## ✨ Summary

This testing setup provides:
- ✅ **MSW API Mocking** - Never call real APIs in tests
- ✅ **Integration Tests** - Test real workflows
- ✅ **Vitest Framework** - Fast, modern testing
- ✅ **React Testing Library** - User-perspective testing
- ✅ **Ready to Scale** - Build components and tests together

When you develop features, write tests alongside them to catch bugs early!
