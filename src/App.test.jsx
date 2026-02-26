import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useState, useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ============================================
// INTEGRATION TEST EXAMPLES FOR PATIENT MANAGEMENT
// ============================================

describe('Patient Management Integration Tests', () => {
  
  // ============ PATIENT LIST ============
  describe('Patient List', () => {
    it('should display list of patients from API', async () => {
      // This will use mocked API from setup.js
      render(<MockPatientList />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should handle loading state while fetching patients', async () => {
      render(<MockPatientListLoading />);
      
      // Check loading state appears
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      render(<MockPatientListWithError />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading patients/i)).toBeInTheDocument();
      });
    });
  });

  // ============ PATIENT REGISTRATION ============
  describe('Patient Registration', () => {
    it('should register a new patient successfully', async () => {
      const user = userEvent.setup();
      render(<MockPatientRegistrationSuccess />);
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'Alice Johnson');
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/age/i), '28');
      await user.type(screen.getByLabelText(/disease/i), 'Asthma');
      
      // Submit
      await user.click(screen.getByRole('button', { name: /register/i }));
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      render(<MockPatientRegistrationValidation />);
      
      // Submit without filling form
      await user.click(screen.getByRole('button', { name: /register/i }));
      
      // Check validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<MockPatientRegistrationValidation />);
      
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /register/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      render(<MockPatientRegistrationSuccess />);
      
      // Fill and submit
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Alice Johnson');
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
      await user.type(screen.getByLabelText(/age/i), '28');
      await user.type(screen.getByLabelText(/disease/i), 'Asthma');
      
      await user.click(screen.getByRole('button', { name: /register/i }));
      
      // Wait for success and verify form is cleared
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });
    });
  });

  // ============ LOGIN FLOW ============
  describe('Login Integration', () => {
    it('should login user with valid credentials', async () => {
      const user = userEvent.setup();
      render(<MockLoginFormSuccess />);
      
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });

    it('should show error with invalid credentials', async () => {
      const user = userEvent.setup();
      render(<MockLoginFormError />);
      
      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  // ============ APPOINTMENTS ============
  describe('Appointment Booking', () => {
    it('should display patient appointments', async () => {
      render(<MockAppointmentList patientId={1} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Dr. Smith/i)).toBeInTheDocument();
        expect(screen.getByText(/Dr. Brown/i)).toBeInTheDocument();
      });
    });

    it('should book new appointment', async () => {
      const user = userEvent.setup();
      render(<MockAppointmentBookingSuccess patientId={1} />);
      
      await user.type(screen.getByLabelText(/date/i), '2025-12-28');
      await user.type(screen.getByLabelText(/time/i), '15:30');
      await user.type(screen.getByLabelText(/doctor/i), 'Dr. Wilson');
      await user.click(screen.getByRole('button', { name: /book/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/appointment booked/i)).toBeInTheDocument();
      });
    });
  });

  // ============ PATIENT UPDATE ============
  describe('Patient Update', () => {
    it('should update patient information', async () => {
      const user = userEvent.setup();
      render(<MockPatientUpdateSuccess patientId={1} />);
      
      // Wait for form to load with current data
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });
      
      // Update name
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'John Smith');
      
      // Submit
      await user.click(screen.getByRole('button', { name: /update/i }));
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  // ============ DELETE PATIENT ============
  describe('Delete Patient', () => {
    it('should delete patient after confirmation', async () => {
      const user = userEvent.setup();
      render(<MockPatientDeleteSuccess patientId={1} />);
      
      await user.click(screen.getByRole('button', { name: /delete/i }));
      
      // Confirm deletion in modal
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/deletion successful/i)).toBeInTheDocument();
      });
    });

    it('should cancel deletion', async () => {
      const user = userEvent.setup();
      render(<MockPatientDeleteCancel patientId={1} />);
      
      await user.click(screen.getByRole('button', { name: /delete/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(screen.queryByText(/deletion successful/i)).not.toBeInTheDocument();
    });
  });
});

// ============================================
// MOCK COMPONENTS (Replace with your actual components)
// ============================================

const MockPatientList = () => (
  <div>
    <h2>Patient List</h2>
    <div>John Doe</div>
    <div>Jane Smith</div>
  </div>
);

const MockPatientListLoading = () => {
  const [data, setData] = useState(null);

  // Simulate loading data after component mount
  useEffect(() => {
    const timer = setTimeout(() => setData([]), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {data !== null ? (
        <>
          <div>John Doe</div>
          <div>Jane Smith</div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

const MockPatientListWithError = () => (
  <div>
    <div style={{ color: 'red' }}>Error loading patients</div>
  </div>
);

const MockPatientRegistrationSuccess = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name: <input />
      </label>
      <label>
        Email: <input />
      </label>
      <label>
        Age: <input />
      </label>
      <label>
        Disease: <input />
      </label>
      <button>Register</button>
      {submitted && <div>Registration successful</div>}
    </form>
  );
};

const MockPatientRegistrationValidation = () => {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({
      name: 'Name is required',
      email: 'Email is required',
      invalidEmail: 'Invalid email',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name: <input />
      </label>
      <label>
        Email: <input />
      </label>
      <label>
        Age: <input />
      </label>
      <label>
        Disease: <input />
      </label>
      <button>Register</button>
      {errors?.name && <div style={{ color: 'red' }}>{errors.name}</div>}
      {errors?.email && <div style={{ color: 'red' }}>{errors.email}</div>}
      {errors?.invalidEmail && (
        <div style={{ color: 'red' }}>{errors.invalidEmail}</div>
      )}
    </form>
  );
};

const MockLoginFormSuccess = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoggedIn(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email: <input />
      </label>
      <label>
        Password: <input type="password" />
      </label>
      <button>Login</button>
      {loggedIn && <div>Login successful</div>}
    </form>
  );
};

const MockLoginFormError = () => {
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email: <input />
      </label>
      <label>
        Password: <input type="password" />
      </label>
      <button>Login</button>
      {error && <div style={{ color: 'red' }}>Invalid credentials</div>}
    </form>
  );
};

const MockAppointmentList = ({ patientId }) => (
  <div>
    <h2>Appointments</h2>
    <div>Dr. Smith</div>
    <div>Dr. Brown</div>
  </div>
);

const MockAppointmentBookingSuccess = ({ patientId }) => {
  const [booked, setBooked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setBooked(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Date: <input type="date" />
      </label>
      <label>
        Time: <input type="time" />
      </label>
      <label>
        Doctor: <input />
      </label>
      <button>Book</button>
      {booked && <div>Appointment booked</div>}
    </form>
  );
};

const MockPatientUpdateSuccess = ({ patientId }) => {
  const [updated, setUpdated] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdated(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name: <input defaultValue="John Doe" />
      </label>
      <button>Update</button>
      {updated && <div>Updated successfully</div>}
    </form>
  );
};

const MockPatientDeleteSuccess = ({ patientId }) => {
  const [deleted, setDeleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => setShowConfirm(true);
  const handleConfirm = () => setDeleted(true);

  return (
    <div>
      <button onClick={handleDelete}>Delete</button>
      {showConfirm && (
        <>
          <button onClick={handleConfirm}>Confirm</button>
          <button>Cancel</button>
        </>
      )}
      {deleted && <div>Deletion successful</div>}
    </div>
  );
};

const MockPatientDeleteCancel = ({ patientId }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => setShowConfirm(true);
  const handleCancel = () => setShowConfirm(false);

  return (
    <div>
      <button onClick={handleDelete}>Delete</button>
      {showConfirm && (
        <>
          <button>Confirm</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      )}
    </div>
  );
};