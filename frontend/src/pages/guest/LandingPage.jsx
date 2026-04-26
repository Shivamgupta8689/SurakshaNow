import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { detachListener, listenToAllIncidents } from '../../services/firebase';

const LandingPage = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const incidentsRef = listenToAllIncidents(setIncidents);
    return () => detachListener(incidentsRef);
  }, []);

  const activeIncident = incidents
    .filter((incident) => ['active', 'inprogress'].includes(incident.status))
    .sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0))[0];

  return (
    <div className="min-h-screen bg-navy-950 grid-bg flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-red flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-wider uppercase">ASAP</span>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <Link to="/staff/login" className="text-text-secondary text-[11px] hover:text-white font-semibold uppercase tracking-wider transition-colors">
            Staff Login
          </Link>
          <Link to="/manager/login" className="btn-outline text-[11px] px-4 py-2 uppercase tracking-wider">
            Manager Login
          </Link>
        </div>
      </nav>

      {activeIncident && (
        <div className="bg-accent-red px-4 sm:px-6 py-4 animate-pulse-red">
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <div className="shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm uppercase tracking-wide mb-1">
                Hotel Safety Alert
              </p>
              <p className="text-red-100 text-xs leading-relaxed">
                {activeIncident.immediateAction ||
                  'An emergency has been reported in the hotel. Please stay calm, follow staff instructions, and avoid the affected area.'}
              </p>
              <p className="text-red-200 text-[10px] mt-1 uppercase tracking-wider">
                Incident type: {activeIncident.type || activeIncident.incidentType || 'Emergency'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12 lg:py-0">
        <div className="max-w-3xl">
          <span className="text-accent-red text-xs font-semibold uppercase tracking-[0.2em] block mb-4">
            AI-Powered Emergency Response Platform
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white uppercase tracking-tight leading-tight mb-6">
            Protect Every Guest<br />
            <span className="text-text-secondary">Command Every Crisis</span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
            AI-powered emergency detection, real-time coordination, and instant response 
            for hotels and resorts. Connect guests, staff, and managers in seconds when 
            every second counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link to="/guest/301-3" className="btn-primary text-center">
              Get Started
            </Link>
            <button className="btn-outline-white text-center">
              Watch Demo
            </button>
          </div>
          <p className="text-text-muted text-xs">
            Powered by Google Gemini AI and Firebase
          </p>
        </div>
      </main>

      {/* Stats Bar */}
      <div className="border-t border-border px-4 sm:px-6 lg:px-12 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-border">
          {[
            { value: '< 4s', label: 'Alert Delivery' },
            { value: '3', label: 'User Roles' },
            { value: '6', label: 'Emergency Types' },
            { value: 'Zero', label: 'Manual Input Required' },
          ].map((stat, i) => (
            <div key={i} className="sm:px-6 first:sm:pl-0 last:sm:pr-0 text-center sm:text-left">
              <span className="text-white text-xl sm:text-2xl font-bold block">{stat.value}</span>
              <span className="text-text-muted text-[10px] uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
