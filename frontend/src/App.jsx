import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from "react";
import { auth } from "./services/firebase.js";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

import LandingPage from './pages/guest/LandingPage';
import QRLanding from './pages/guest/QRLanding';
import SOSPage from './pages/guest/SOSPage';
import AnalyzingState from './pages/guest/AnalyzingState';
import AutoFilledForm from './pages/guest/AutoFilledForm';
import AlertConfirmation from './pages/guest/AlertConfirmation';
import GuestChat from './pages/guest/GuestChat';

import StaffLogin from './pages/staff/StaffLogin';
import StaffDashboard from './pages/staff/StaffDashboard';

import ManagerLogin from './pages/manager/ManagerLogin';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import Analytics from './pages/manager/Analytics';
import QRGenerator from './pages/manager/QRGenerator';

function App() {
   useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth)
          .then((userCredential) => {
            console.log("Guest UID:", userCredential.user.uid);
          })
          .catch((error) => {
            console.error("Auth error:", error);
          });
      } else {
        console.log("User already logged in:", user.uid);
      }
    });
  }, []);
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0D1526',
            color: '#FFFFFF',
            border: '1px solid #1E2A3A',
            borderRadius: '2px',
            fontSize: '13px',
            fontFamily: '"IBM Plex Sans", sans-serif',
          },
        }}
      />
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest Routes */}
        <Route path="/guest/:roomId" element={<QRLanding />} />
        <Route path="/guest/:roomId/sos" element={<SOSPage />} />
        <Route path="/guest/:roomId/analyzing" element={<AnalyzingState />} />
        <Route path="/guest/:roomId/form" element={<AutoFilledForm />} />
        <Route path="/guest/:roomId/confirm" element={<AlertConfirmation />} />
        <Route path="/guest/:roomId/chat/:incidentId" element={<GuestChat />} />

        {/* Staff Routes */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />

        {/* Manager Routes */}
        <Route path="/manager/login" element={<ManagerLogin />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/analytics" element={<Analytics />} />
        <Route path="/manager/qr-codes" element={<QRGenerator />} />
      </Routes>
    </>
  );
}

export default App;