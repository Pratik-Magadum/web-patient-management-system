import { useEffect, useState } from 'react';
import { getHospitalDetails } from '../services/api';
import '../styles/loader.css';
import Login from './Login';
import NotRegistered from './NotRegistered';

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
          setIsLoading(false);
          throw apiError;
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Hospital loading error:', err);
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
