import ReceptionistDashboard from './ReceptionistDashboard';

export default function DoctorDashboard({ hospitalDetails, onLogout, featureError }) {
 
    return (
    <ReceptionistDashboard
      hospitalDetails={hospitalDetails}
      onLogout={onLogout}
      roleName="Doctor"
      featureError={featureError}
    />
  );
}
