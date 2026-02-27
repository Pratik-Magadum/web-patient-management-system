import React from 'react';
import '../styles/notregistered.css';

export default function NotRegistered({ hospitalName }) {
  return (
    <div className="notregistered-container">
      <div className="notregistered-card">
        <div className="notregistered-header">
          <div className="notregistered-icon">🏥</div>
          <h1>Hospital Registration Required</h1>
        </div>

        <div className="notregistered-content">
          <p className="notregistered-message">
            The hospital <strong>"{hospitalName}"</strong> is not registered in our system.
          </p>

          <p className="notregistered-instruction">
            To register your hospital and access the Patient Management System, please contact our support team:
          </p>

          <div className="contact-section">
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <div className="contact-info">
                <p className="contact-label">Email</p>
                <a href="mailto:support@hospital-management.com" className="contact-link">
                  support@hospital-management.com
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">📱</div>
              <div className="contact-info">
                <p className="contact-label">Phone</p>
                <a href="tel:+1-800-HOSPITAL" className="contact-link">
                  +1-800-HOSPITAL (1-800-467-8426)
                </a>
              </div>
            </div>
          </div>

          <div className="benefits-section">
            <h3>After Registration, You'll Get Access To:</h3>
            <ul className="benefits-list">
              <li>👥 Patient Management System</li>
              <li>📅 Appointment Scheduling</li>
              <li>📊 Real-time Analytics</li>
              <li>🔐 Secure Authentication</li>
              <li>📈 Business Intelligence</li>
              <li>🌐 Multi-user Support</li>
            </ul>
          </div>

          <div className="info-box">
            <p className="info-title">ℹ️ Need More Information?</p>
            <p className="info-text">
              Visit our website at <strong>www.hospital-management.com</strong> or check out our documentation for more details about the registration process.
            </p>
          </div>
        </div>

        <div className="notregistered-footer">
          <p className="footer-text">
            Hospital Code: <code>{hospitalName}</code>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-retry-hospital"
          >
            Try Another Hospital
          </button>
        </div>
      </div>

      <div className="background-decoration">
        <div className="decoration-circle decoration-circle-1"></div>
        <div className="decoration-circle decoration-circle-2"></div>
        <div className="decoration-circle decoration-circle-3"></div>
      </div>
    </div>
  );
}
