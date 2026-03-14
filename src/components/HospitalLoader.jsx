import { useEffect, useState } from 'react';
import { getAccessToken, getHospitalDetails, getUserRole } from '../services/api';
import '../styles/loader.css';
import Login from './Login';
import NotRegistered from './NotRegistered';
import ReceptionistDashboard from './ReceptionistDashboard';

export default function HospitalLoader() {
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [error, setError] = useState(null);
  const [loggedInRole, setLoggedInRole] = useState(() => {
    // Check if user is already logged in
    return getAccessToken() ? getUserRole() : null;
  });

  useEffect(() => {
    const loadHospital = async () => {
      try {
        setIsLoading(true);

        const hostname = window.location.hostname;
        let hospital = null;

        // Check if hostname contains "-localhost" (development format)
        if (hostname.includes('-localhost')) {
          const parts = hostname.split('-localhost')[0];
          hospital = parts || null;
        }

        // Fallback to query parameter
        if (!hospital) {
          const params = new URLSearchParams(window.location.search);
          hospital = params.get('hospital');
        }

        // Fallback to path
        if (!hospital) {
          const pathSegments = window.location.pathname.split('/').filter(Boolean);
          hospital = pathSegments[0];
        }

        // Default to 'apollo-eye' if no hospital name found
        if (!hospital) {
          hospital = 'apollo-eye';
        }

        if (import.meta.env.DEV) {
          console.log('🏥 Hospital extracted:', hospital);
        }
        
        setHospitalName(hospital);

        try {
          // Call getHospitalDetails API with subdomain
          const hospitalResponse = await getHospitalDetails(hospital);
          
          // Extract hospital data from the response
          const details = {
            registered: true,
            ...hospitalResponse.data,
          };
          
          if (import.meta.env.DEV) {
            console.log('✅ Hospital details loaded:', details);
          }
          
          setHospitalDetails(details);
          setIsRegistered(true);
        } catch (apiError) {
          console.error('❌ Failed to load hospital:', apiError.message);
          setError(apiError.message);
          setIsRegistered(false);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Hospital loading error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadHospital();
  }, []);

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p>Loading hospital information...</p>
      </div>
    );
  }

  if (!hospitalDetails) {
    return <NotRegistered hospitalName={hospitalName} error={error} />;
  }

  // If hospital is not registered, show registration page
  if (!isRegistered) {
    return <NotRegistered hospitalName={hospitalName} />;
  }

  // If user is logged in, render dashboard based on role
  if (loggedInRole) {
    const handleLogout = () => {
      setLoggedInRole(null);
    };

    switch (loggedInRole) {
      case 'reciption':
      case 'RECEPTIONIST':
        return <ReceptionistDashboard hospitalDetails={hospitalDetails} onLogout={handleLogout} />;
      default:
        return (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h2>Dashboard for "{loggedInRole}" role is coming soon.</h2>
            <button onClick={handleLogout} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>Logout</button>
          </div>
        );
    }
  }

  // If hospital is registered, show login page
  return (
    <Login
      hospitalName={hospitalName}
      hospitalDetails={hospitalDetails}
      onLoginSuccess={(role) => setLoggedInRole(role)}
    />
  );
}
