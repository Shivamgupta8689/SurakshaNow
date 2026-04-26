import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { detachListener, listenToAllIncidents } from '../../services/firebase';

const LandingPage = () => {
  const [incidents, setIncidents] = useState([]);

  // ✅ sessionStorage se lo
  const [myIncidentId, setMyIncidentId] = useState(sessionStorage.getItem('myIncidentId'));
  const [myRoomId, setMyRoomId] = useState(sessionStorage.getItem('myRoomId'));

  const myIncident = incidents.find(i => i.id === myIncidentId);

  // ✅ Resolved hone par clear karo
  useEffect(() => {
    if (myIncident && myIncident.status === 'resolved') {
      sessionStorage.removeItem('myIncidentId');
      sessionStorage.removeItem('myRoomId');
      setMyIncidentId(null);
      setMyRoomId(null);
    }
  }, [myIncident]);

  useEffect(() => {
    const incidentsRef = listenToAllIncidents(setIncidents);
    return () => detachListener(incidentsRef);
  }, []);

  const activeIncidents = incidents
    .filter((incident) => ['active', 'inprogress'].includes(incident.status))
    .sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0));

  return (
    <div className="min-h-screen bg-navy-950 grid-bg flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 border-b border-border">
        <div className="flex items-center">
          <img
            src="/asap.png"
            alt="ASAP Logo"
            className="h-16 sm:h-18 lg:h-20 w-auto object-contain"
          />
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

      {/* Hero Content & Active Incidents list */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-12 py-12 lg:py-0 gap-8 lg:gap-12 w-full">
        <div className="w-full max-w-3xl">
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
            {/* ✅ Track button — sessionStorage se check hoga */}
            {myIncidentId && myRoomId && myIncident && ['active', 'inprogress'].includes(myIncident.status) && (
              <Link
                to={`/guest/${myRoomId}/chat/${myIncidentId}`}
                className="btn-primary bg-orange-600 hover:bg-orange-700 border-none text-center shadow-[0_0_15px_rgba(234,88,12,0.3)] animate-pulse hover:animate-none"
              >
                Track My Alert Status
              </Link>
            )}
          </div>
        </div>

        {/* Active Incidents Right Sidebar List */}
        {activeIncidents.length > 0 && (
          <div className="w-full lg:w-[450px] shrink-0 flex flex-col justify-center py-4 lg:py-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                Active Alerts
              </h2>
              <span className="text-red-400/80 text-[10px] uppercase font-bold tracking-wider">
                {activeIncidents.length} {activeIncidents.length === 1 ? 'Incident' : 'Incidents'}
              </span>
            </div>

            <div className="flex flex-col gap-4 max-h-[60vh] lg:max-h-[500px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] transition-all duration-500 group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500"></div>

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="shrink-0 mt-1 relative">
                      <div className="absolute inset-0 bg-red-500 blur-md opacity-60 rounded-full animate-pulse"></div>
                      <div className="w-11 h-11 bg-red-600/30 border border-red-500 rounded-full flex items-center justify-center relative shadow-[0_0_18px_rgba(239,68,68,0.6)] group-hover:shadow-[0_0_28px_rgba(239,68,68,0.9)] transition-all duration-300">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider truncate mr-2">
                          {incident.type || incident.incidentType || 'Emergency'}
                        </h3>
                        <span className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[9px] text-red-300 font-bold uppercase tracking-widest leading-none">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                          {incident.status === 'inprogress' ? 'In Progress' : 'Active'}
                        </span>
                      </div>

                      <p className="text-red-100/80 text-xs leading-relaxed mb-3 mt-2 line-clamp-3">
                        {incident.immediateAction || 'An emergency has been reported. Please follow staff instructions and stay safe.'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-red-400/60 text-[10px] uppercase tracking-wider font-semibold">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </div>
                        {(incident.locationName || incident.roomNumber) && (
                          <div className="flex items-center text-white/50 text-[10px] uppercase tracking-wider font-semibold">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {incident.locationName || `Room ${incident.roomNumber}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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