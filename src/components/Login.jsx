import { useState } from 'react';
import { loginUser } from '../services/api';
import '../styles/login.css';

export default function Login({ hospitalName, hospitalDetails, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await loginUser(hospitalDetails?.hospitalId || hospitalDetails?.id, username, password);
      const { role } = response.data;

      if (onLoginSuccess) {
        onLoginSuccess(role);
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="hospital-icon">👁️</div>
          <h1>{hospitalDetails?.name || 'Hospital Management'}</h1>
          <p className="subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-signin"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {hospitalDetails?.demoCredentials && (
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            {hospitalDetails.demoCredentials.map((cred, index) => (
              <p key={index} className="demo-item">
                <strong>{cred.role}:</strong> {cred.username} / {cred.password}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
