import React, { useState, useEffect } from 'react';
import { getHospital } from '../services/api';
import Login from './Login';
import NotRegistered from './NotRegistered';
import '../styles/loader.css';

export default function HospitalLoader() {
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hospitalName, setHospitalName] = useState('');

  useEffect(() => {
    const loadHospital = async () => {
      try {
        setIsLoading(true);

        const hostname = window.location.hostname;
        let hospital = null;

        // Check if hostname contains "-localhost" (development format)
        if (hostname.includes('-localhost') || hostname.includes('localhost')) {
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

        // Default to 'general' hospital if no hospital name found
        if (!hospital) {
          hospital = 'general-hospital';
        }

        setHospitalName(hospital);

        // Call getHospital API with hospital name in header
        const details = await getHospital(hospital);
        setHospitalDetails(details);

        // Check if hospital is registered
        const registered = details.registered === true;
        setIsRegistered(registered);

        setIsLoading(false);
      } catch (err) {
        console.error('Hospital loading error:', err);
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
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If hospital is not registered, show registration page
  if (!isRegistered) {
    return <NotRegistered hospitalName={hospitalName} />;
  }

  // If hospital is registered, show login page
  return (
    <Login hospitalName={hospitalName} hospitalDetails={hospitalDetails} />
  );
}
