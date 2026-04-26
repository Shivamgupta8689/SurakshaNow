import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, off } from 'firebase/database';
import { database, listenToAllIncidents, detachListener } from '../../services/firebase';

const locationMap = {
  lobby: 'Lobby',
  restaurant: 'Restaurant',
  pool: 'Swimming Pool',
  parking: 'Parking',
  gym: 'Gym',
  banquet: 'Banquet Hall',
  elevator: 'Elevator',
  garden: 'Garden',
  terrace: 'Terrace',
  reception: 'Reception',
};

const getFloorKey = (rawFloor) => {
  const value = String(rawFloor || 'ground').trim().toLowerCase();
  if (!value) return 'ground';
  if (['ground', 'basement', 'terrace'].includes(value)) return value;
  if (value.startsWith('floor')) return value.replace(/\s+/g, '');
  if (!Number.isNaN(Number(value))) return `floor${value}`;
  return value.replace(/\s+/g, '');
};

const QRLanding = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [broadcast, setBroadcast] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [myIncidentId, setMyIncidentId] = useState(localStorage.getItem('myIncidentId'));

  const myIncident = incidents.find(i => i.id === myIncidentId);

  useEffect(() => {
    if (myIncident && myIncident.status === 'resolved') {
      localStorage.removeItem('myIncidentId');
      localStorage.removeItem('myRoomId');
      setMyIncidentId(null);
    }
  }, [myIncident]);

  const parts = roomId ? roomId.split('-') : ['000', 'floor0'];

  const isRoom = !isNaN(parts[0]);
  const locationName = isRoom
    ? `Room ${parts[0]}`
    : locationMap[parts[0].toLowerCase()] || parts[0];

  const rawFloor = parts[1] || 'ground';
  const floor = rawFloor.toLowerCase().replace('floor', '') || 'Ground';
  const floorLabel = isNaN(floor)
    ? floor.charAt(0).toUpperCase() + floor.slice(1)
    : `Floor ${floor}`;

  const floorKey = getFloorKey(rawFloor);

  // Listen for active broadcast on this floor
  useEffect(() => {
    if (!database) return;
    const broadcastRef = ref(database, `asap/broadcasts/${floorKey}`);
    onValue(broadcastRef, (snap) => {
      const data = snap.val();
      // Only show if broadcast is active
      if (data && data.active) {
        setBroadcast(data);
      } else {
        setBroadcast(null);
      }
    });
    return () => off(broadcastRef);
  }, [floorKey]);

  useEffect(() => {
    const incidentsRef = listenToAllIncidents(setIncidents);
    return () => detachListener(incidentsRef);
  }, []);

  const activeIncidents = incidents
    .filter((incident) => ['active', 'inprogress'].includes(incident.status))
    .sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0));

  const activeFloorIncident = activeIncidents
    .filter((incident) => (
      getFloorKey(incident.floor) === floorKey
    ))[0];

  const automaticIncident = activeFloorIncident || activeIncidents[0];

  const visibleAlert = broadcast || (automaticIncident
    ? {
      heading: activeFloorIncident ? `Safety Alert - ${floorLabel}` : 'Hotel Safety Alert',
      incidentType: automaticIncident.type || automaticIncident.incidentType,
      message:
        automaticIncident.immediateAction ||
        'An emergency has been reported in the hotel. Please stay calm, follow staff instructions, and avoid the affected area.',
    }
    : null);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/asap.png"
            alt="ASAP Logo"
            className="h-16 w-auto object-contain"
          />
          <span className="text-white font-bold text-xl tracking-wider uppercase">
            ASAP
          </span>
        </div>
        <div className="bg-accent-red px-3 py-1">
          <span className="text-white text-xs font-semibold">
            {locationName} / {floorLabel}
          </span>
        </div>
      </div>


        <div className="bg-accent-red bg-opacity-20 border-b border-accent-red px-4 sm:px-6 py-3">
          <p className="text-accent-red text-xs font-semibold uppercase tracking-wide text-center">
            Connected to Hotel Emergency System
          </p>
        </div>
      

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-12 py-8 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* Photo Card */}
          <button
            onClick={() =>
              navigate(`/guest/${roomId}/sos`, {
                state: { mode: 'photo', locationName, floorLabel },
              })
            }
            className="flex-1 card-dark flex flex-col items-center justify-center py-12 lg:py-20 hover:border-accent-red transition-colors group cursor-pointer"
          >
            <div className="w-16 h-16 border-2 border-text-muted group-hover:border-accent-red flex items-center justify-center mb-4 transition-colors">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-text-muted group-hover:text-accent-red transition-colors"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg uppercase tracking-wide mb-2">Photo</h2>
            <p className="text-text-secondary text-xs text-center max-w-48">
              Upload or capture image of emergency
            </p>
          </button>

          {/* Voice Card */}
          <button
            onClick={() =>
              navigate(`/guest/${roomId}/sos`, {
                state: { mode: 'voice', locationName, floorLabel },
              })
            }
            className="flex-1 card-dark flex flex-col items-center justify-center py-12 lg:py-20 hover:border-accent-red transition-colors group cursor-pointer"
          >
            <div className="w-16 h-16 border-2 border-text-muted group-hover:border-accent-red flex items-center justify-center mb-4 transition-colors">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-text-muted group-hover:text-accent-red transition-colors"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg uppercase tracking-wide mb-2">Voice</h2>
            <p className="text-text-secondary text-xs text-center max-w-48">
              Speak to describe emergency
            </p>
          </button>

        </div>

        <p className="text-text-muted text-xs text-center mt-6">
          Both options can be used together for better accuracy
        </p>

        {myIncidentId && myIncident && ['active', 'inprogress'].includes(myIncident.status) && (
          <button
            onClick={() => navigate(`/guest/${roomId}/chat/${myIncidentId}`)}
            className="btn-primary w-full mt-4 text-center text-xs bg-orange-600 hover:bg-orange-700 border-none shadow-[0_0_15px_rgba(234,88,12,0.3)] animate-pulse hover:animate-none"
          >
            Track My Alert Status
          </button>
        )}

        <button
          onClick={() =>
            navigate(`/guest/${roomId}/sos`, {
              state: { mode: 'non-emergency', locationName, floorLabel },
            })
          }
          className="btn-outline w-full mt-4 text-center text-xs"
        >
          Report Non-Emergency Issue
        </button>
      </div>
    </div>
  );
};

export default QRLanding;
