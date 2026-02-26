# Integration Test Writing Checklist & Prompt Template

Use this guide whenever you ask me to "write integration test cases" for a component.

---

## 📋 Before Asking Me to Write Tests

Make sure you have:

- [ ] Component built in `App.jsx` or separate component file
- [ ] API endpoints defined (or ready to be mocked in `src/setup.js`)
- [ ] Component uses React hooks (useState, useEffect)
- [ ] Component makes API calls via `fetch` or similar

---

## 💬 How to Ask for Integration Tests

### ✅ Good Request:
```
"Write integration tests for the PatientList component. 
It fetches patients from GET /api/patients, 
shows a loading state, and displays patient names in a list."
```

### ❌ Vague Request:
```
"Write tests for my component."
```

---

## 🎯 Test Scenarios I'll Cover

When you ask for integration tests, I'll write tests for:

### **1. Rendering & Display**
- [ ] Component renders without errors
- [ ] Shows correct initial content
- [ ] Displays expected heading/labels

### **2. Async Operations**
- [ ] Shows loading state while fetching
- [ ] Removes loading state when data arrives
- [ ] Displays data from API (MSW mocked)

### **3. User Interactions**
- [ ] Click handlers work
- [ ] Form inputs capture values
- [ ] Buttons trigger actions

### **4. Form Validation**
- [ ] Shows error messages for missing fields
- [ ] Validates email format
- [ ] Prevents submission with invalid data

### **5. Error Handling**
- [ ] Displays error messages when API fails
- [ ] Allows retry on error
- [ ] Doesn't crash app

### **6. State Management**
- [ ] Updates UI when data changes
- [ ] Clears form after submission
- [ ] Maintains state correctly

---

## 🔧 What I Need From You

When requesting integration tests, provide:

```markdown
**Component Name:** PatientRegistration

**What it does:** 
- Displays registration form with name, email, age fields
- Validates required fields
- Submits to POST /api/patients
- Shows success message on success
- Shows error on failure

**Key Features to Test:**
1. Form displays correctly
2. Validation prevents invalid submissions
3. Email format validation
4. Success message appears after submission
5. Form clears after successful submission
6. Error handling if API fails
```

---

## 📝 Integration Test Template

I'll follow this structure:

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  // Rendering Tests
  it('should render component correctly', () => {
    render(<YourComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  // API/Loading Tests
  it('should fetch and display data', async () => {
    render(<YourComponent />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Expected Data')).toBeInTheDocument();
    });
  });

  // Interaction Tests
  it('should handle user actions', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    await user.click(screen.getByRole('button', { name: /action/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  // Validation Tests
  it('should validate inputs', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  // Error Tests
  it('should handle errors', async () => {
    render(<ComponentWithError />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 Key Testing Principles (From Discussion)

### **1. Mock APIs - Never Call Real Endpoints**
```javascript
// ✅ Good - MSW intercepts automatically
fetch('/api/patients')  // Mocked by MSW

// ❌ Bad - Don't call real API
fetch('https://real-api.com/patients')
```

### **2. Test User Perspective**
```javascript
// ✅ Good - User sees this
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByText(/welcome/i)

// ❌ Bad - Implementation details
screen.getByTestId('submit-btn')
wrapper.find('.submit-button')
```

### **3. Wait for Async Operations**
```javascript
// ✅ Good - Waits for display update
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
});

// ❌ Bad - Doesn't wait for async
expect(screen.getByText('Data')).toBeInTheDocument();
```

### **4. Use userEvent for Interactions**
```javascript
// ✅ Good - Realistic user behavior
await user.type(input, 'value');
await user.click(button);

// ❌ Bad - Low-level simulation
fireEvent.change(input, { target: { value: 'value' } });
```

### **5. Focus on 80% Integration Tests**
```javascript
✅ Test workflows (component + API + state together)
❌ Test individual functions (unless complex logic)
```

---

## 📊 Coverage Target

For a feature, I aim for:

| Scenario | Tests |
|----------|-------|
| Successful workflow | 1-2 |
| Validation/Errors | 1-2 |
| Loading states | 1 |
| Edge cases | 1 |
| **Total** | **4-6** |

---

## 🎯 Right Now - Your Setup is Ready

✅ `src/setup.js` - API mocks ready  
✅ `vitest.config.js` - Test config done  
✅ `package.json` - Test scripts added (npm test)  
✅ Frameworks installed (Vitest, RTL, MSW, userEvent)  

### What's Next:
1. Build your components in `App.jsx`
2. Ask me: "Write integration tests for [ComponentName]"
3. I'll create tests following this guide
4. Run: `npm test`

---

## 💡 Example Request

```
"I've built a PatientForm component in App.jsx.

It has:
- Name input (required)
- Email input (required, must be valid email)
- Submit button
- Calls POST /api/patients on submit
- Shows success message on success
- Shows error message on failure
- Should clear form after success

Write integration tests for this component."
```

Then I'll write all the tests following the patterns in this guide!

---

## 🔄 Process

1. **You say:** "Write integration tests for PatientForm"
2. **I check:** Does component exist? What does it do?
3. **I write:** Tests covering all scenarios
4. **You run:** `npm test`
5. **Tests pass** ✅ or **Tests fail** ❌ → Fix component → Rerun tests

---

## 📌 Key Files Reference

- **Testing Guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md) - Read this first!
- **API Mocks:** [src/setup.js](src/setup.js) - All API stubs
- **Test Config:** [vitest.config.js](vitest.config.js) - Vitest settings
- **Your Tests:** [src/App.test.jsx](src/App.test.jsx) - Write here

---

## ❓ FAQ

**Q: Do I need to mock APIs manually?**  
A: No! MSW in `setup.js` automatically intercepts all fetch calls.

**Q: Can I test with real API?**  
A: Not recommended. Tests should be reliable. Use mocks.

**Q: What if API endpoint doesn't exist?**  
A: Add it to `src/setup.js` first, then write tests.

**Q: How do I test error scenarios?**  
A: Use special test components or `server.use()` to override handlers.

**Q: Should I write tests first or code first?**  
A: You can do either, but tests-first (TDD) catches bugs earlier!

---

## ✨ Remember

Every test I write will:
- ✅ Test real component behavior
- ✅ Mock all APIs automatically
- ✅ Follow user interaction patterns
- ✅ Wait for async operations
- ✅ Be maintainable and clear
- ✅ Focus on integration (workflows)

**Just tell me what component you built and what it does!**
