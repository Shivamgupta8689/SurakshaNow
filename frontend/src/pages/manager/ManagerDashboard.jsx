import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  auth,
  detachListener,
  listenToAllIncidents,
  seedDemoData,
  sendBroadcast,
  updateIncident,
} from '../../services/firebase';
import MetricCard from '../../components/MetricCard';
import SeverityBadge from '../../components/SeverityBadge';
import EscalationModal from '../../components/EscalationModal';
import IncidentDetail from './IncidentDetail';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

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
  conference: 'Conference Room',
  storage: 'Storage',
  lounge: 'Sky Lounge',
};

const getLocationLabel = (incident) => {
  const roomNumber = incident?.roomNumber;
  if (!roomNumber) return `Floor ${incident?.floor || 'N/A'}`;

  const isRoom = !Number.isNaN(Number(roomNumber));
  const locationName = isRoom
    ? `Room ${roomNumber}`
    : locationMap[String(roomNumber).toLowerCase()] || roomNumber;

  return `${locationName}, Floor ${incident?.floor || 'N/A'}`;
};

const getFloorKey = (floor) => {
  const value = String(floor || 'ground').trim().toLowerCase();
  if (!value) return 'ground';
  if (['ground', 'basement', 'terrace'].includes(value)) return value;
  if (value.startsWith('floor')) return value.replace(/\s+/g, '');
  if (!Number.isNaN(Number(value))) return `floor${value}`;
  return value.replace(/\s+/g, '');
};

const BroadcastModal = ({ incident, onClose, onSend }) => {
  const floorKey = getFloorKey(incident?.floor);
  const defaultMessage = `Safety alert on Floor ${incident?.floor || 'N/A'}: ${incident?.type || incident?.incidentType || 'Emergency'
    } reported at ${getLocationLabel(incident)}. Please stay calm, follow staff instructions, and avoid the affected area.`;

  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(floorKey, message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-900 border border-border w-full max-w-lg animate-fade-in">
        <div className="bg-accent-red px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Broadcast Floor Alert
          </h3>
          <button onClick={onClose} className="text-white text-lg leading-none hover:opacity-70">
            X
          </button>
        </div>

        <div className="p-4">
          <div className="bg-navy-950 border border-border p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-muted text-[10px] uppercase tracking-wider">
                Target
              </span>
              <span className="text-accent-red text-[10px] font-mono">{floorKey}</span>
            </div>
            <p className="text-white text-xs font-semibold">
              {incident?.type || incident?.incidentType || 'Emergency'} - {getLocationLabel(incident)}
            </p>
            <p className="text-text-muted text-[10px] mt-0.5">
              Guests scanning QR codes on this floor will see this warning.
            </p>
          </div>

          <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
            Guest Warning Message
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="input-field h-36 resize-none text-xs leading-relaxed"
          />

          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="btn-outline flex-1 text-xs">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className={`btn-primary flex-1 text-xs ${sending || !message.trim() ? 'opacity-50' : ''}`}
            >
              {sending ? 'Broadcasting...' : 'Send Broadcast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const sidebarItems = [
  {
    id: 'command',
    label: 'Command Center',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    id: 'qrcodes',
    label: 'QR Codes',
    icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h3v3h-3v-3zm5 0h2v2h-2v-2zm-5 5h2v2h-2v-2zm4-1h3v3h-3v-3z',
  },
];

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [activeSidebar, setActiveSidebar] = useState('command');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [escalationModal, setEscalationModal] = useState(null);
  const [broadcastModal, setBroadcastModal] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const activeIncidents = incidents.filter((i) => i.status === 'active' || i.status === 'inprogress');

  useEffect(() => {
    const incidentsRef = listenToAllIncidents((items) => {
      setIncidents([...items].sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0)));
    });
    return () => detachListener(incidentsRef);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCount = incidents.filter((incident) => incident.status === 'active').length;
  const pendingCount = incidents.filter((incident) => incident.status === 'inprogress').length;
  const resolvedToday = incidents.filter((incident) => {
    if (!incident.resolvedAt) return false;
    return new Date(incident.resolvedAt).toDateString() === new Date().toDateString();
  }).length;

  const avgResponse = () => {
    const resolved = incidents.filter((incident) => incident.resolvedAt && incident.reportedAt);
    if (resolved.length === 0) return '--';
    const average =
      resolved.reduce(
        (sum, incident) => sum + (Number(incident.resolvedAt) - Number(incident.reportedAt)),
        0
      ) / resolved.length;
    return `${(average / 60000).toFixed(1)}m`;
  };

  const escalatedIncidents = incidents.filter((incident) => {
    if (incident.status !== 'active') return false;
    return now > (incident.escalationTimer || incident.reportedAt + 5 * 60 * 1000);
  });

  const getCountdown = (incident) => {
    const deadline = incident.escalationTimer || incident.reportedAt + 5 * 60 * 1000;
    const remaining = deadline - now;
    const absolute = Math.abs(remaining);
    const mins = Math.floor(absolute / 60000);
    const secs = Math.floor((absolute % 60000) / 1000);
    return `${remaining <= 0 ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSidebarClick = (itemId) => {
    if (itemId === 'analytics') {
      navigate('/manager/analytics');
    } else if (itemId === 'qrcodes') {
      navigate('/manager/qr-codes');
    } else {
      setActiveSidebar(itemId);
    }
    setShowMobileSidebar(false);
  };

  const handleLogout = () => {
    auth.signOut?.();
    navigate('/manager/login');
  };

  const handleSeedDemoData = async () => {
    try {
      await seedDemoData();
      toast.success('Demo Firebase data seeded');
    } catch (error) {
      console.error('Seed data error:', error);
      toast.error('Failed to seed demo data');
    }
  };

  const handleBroadcast = async (floorKey, message) => {
    try {
      await sendBroadcast(floorKey, {
        message,
        incidentType: broadcastModal?.type || broadcastModal?.incidentType || 'Emergency',
        incidentId: broadcastModal?.id,
      });
      await updateIncident(broadcastModal.id, {
        broadcastSent: true,
        broadcastSentAt: Date.now(),
        broadcastFloorKey: floorKey,
      });
      toast.success('Floor safety broadcast sent');
      setBroadcastModal(null);
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
    }
  };

  return (
    <div className="h-screen bg-navy-950 flex flex-col">
      <nav className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileSidebar((show) => !show)}
            className="lg:hidden text-text-secondary hover:text-white"
            aria-label="Toggle manager navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img
  src="/asap.png"
  alt="ASAP Logo"
  className="h-16 sm:h-20 w-auto object-contain"
/>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-white text-xs font-medium block">Operations Manager</span>
            <span className="text-text-muted text-[10px]">MGR-7741</span>
          </div>
          <div className="relative">
            <button 
              className="relative p-1.5 hover:bg-navy-800 rounded-full transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A9BB0" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[8px] w-4 h-4 flex items-center justify-center font-bold rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-10 right-0 w-72 sm:w-80 bg-navy-900 border border-border shadow-xl z-50 flex flex-col max-h-[400px] animate-fade-in origin-top-right rounded-lg overflow-hidden">
                <div className="bg-navy-950 px-4 py-3 border-b border-border flex items-center justify-between shadow-sm">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Active Alerts</span>
                  {activeCount > 0 && (
                    <span className="bg-accent-red/20 border border-accent-red/30 text-accent-red text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-full">
                      {activeCount} New
                    </span>
                  )}
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {activeIncidents.length > 0 ? (
                    activeIncidents.map((inc) => (
                      <div 
                        key={inc.id} 
                        className="p-4 border-b border-border hover:bg-navy-800 transition-colors cursor-pointer group"
                        onClick={() => { setShowNotifications(false); setSelectedIncident(inc); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-xs font-bold truncate pr-3">{inc.type || inc.incidentType || 'Emergency'}</span>
                          <span className={`text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-full border shrink-0 ${inc.status === 'active' ? 'bg-accent-red/10 border-accent-red/30 text-accent-red' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                            {inc.status}
                          </span>
                        </div>
                        <p className="text-text-secondary text-[10px] line-clamp-2 leading-relaxed mb-2">
                          {inc.immediateAction || 'Emergency alert reported. Initial actions required.'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white/60 text-[9px] font-semibold uppercase tracking-wider">
                            {getLocationLabel(inc)} 
                          </span>
                          <span className="text-text-muted text-[9px] font-mono">
                            {inc.reportedAt ? new Date(inc.reportedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center mb-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-muted" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      <span className="text-text-muted text-xs font-medium">No active alerts</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="text-text-muted hover:text-white" aria-label="Log out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 min-h-0">
        <aside className={`${showMobileSidebar ? 'block' : 'hidden'} lg:block w-56 shrink-0 bg-navy-900 border-r border-border flex flex-col absolute lg:relative z-30 h-[calc(100vh-57px)] lg:h-auto`}>
          <div className="py-4 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarClick(item.id)}
                className={`sidebar-item w-full ${activeSidebar === item.id ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500" />
              <span className="text-text-muted text-[10px] uppercase tracking-wider">
                System Health: OK
              </span>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Active Incidents" value={activeCount} pulse={activeCount > 0} />
            <MetricCard label="Pending Response" value={pendingCount} />
            <MetricCard label="Resolved Today" value={resolvedToday} />
            <MetricCard label="Avg Response" value={avgResponse()} />
          </div>

          {incidents.length === 0 && (
            <div className="border border-border bg-navy-900 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-white text-sm font-semibold">No Firebase demo data found</p>
                <p className="text-text-muted text-xs mt-1">
                  Seed staff, manager, and sample incident history for testing.
                </p>
              </div>
              <button onClick={handleSeedDemoData} className="btn-primary text-xs py-2 px-4">
                Seed Demo Data
              </button>
            </div>
          )}

          {escalatedIncidents.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-accent-red" />
                <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                  Escalation Alerts
                </h2>
                <span className="bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  Critical
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {escalatedIncidents.map((incident) => (
                  <div key={incident.id} className="card border-l-4 border-l-accent-red animate-pulse-red">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="bg-navy-600 text-text-secondary text-[10px] px-2 py-0.5 font-mono">
                          {incident.id?.substring(0, 8)}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <SeverityBadge severity={incident.severity} />
                          <span className="text-white text-xs">
                            {incident.type || incident.incidentType || '--'}
                          </span>
                        </div>
                      </div>
                      <span className="text-accent-red text-lg font-mono font-bold">
                        {getCountdown(incident)}
                      </span>
                    </div>
                    <p className="text-white text-lg font-bold mb-1">{getLocationLabel(incident)}</p>
                    <p className="text-text-muted text-xs mb-3">
                      Reported{' '}
                      {incident.reportedAt
                        ? formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true })
                        : '--'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => setEscalationModal(incident)}
                        className="btn-primary w-full text-xs py-2"
                      >
                        Contact Emergency
                      </button>
                      <button
                        onClick={() => setBroadcastModal(incident)}
                        className="btn-outline w-full text-xs py-2"
                      >
                        Broadcast Alert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">
              All Incidents Log
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    {['INC ID', 'Type', 'Severity', 'Location', 'Time', 'Staff', 'Status', 'Actions'].map((heading) => (
                      <th
                        key={heading}
                        className="text-left text-text-muted text-[10px] uppercase tracking-wider font-medium py-3 px-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident, index) => (
                    <tr
                      key={incident.id}
                      className={`border-b border-border ${index % 2 === 0 ? 'bg-navy-900' : 'bg-navy-950'} hover:bg-navy-750 transition-colors`}
                    >
                      <td className="py-3 px-3 text-text-secondary text-xs font-mono">
                        #{incident.id?.substring(0, 8)}
                      </td>
                      <td className="py-3 px-3 text-white text-xs">
                        {incident.type || incident.incidentType || '--'}
                      </td>
                      <td className="py-3 px-3">
                        <SeverityBadge severity={incident.severity} />
                      </td>
                      <td className="py-3 px-3 text-white text-xs">
                        {getLocationLabel(incident)}
                      </td>
                      <td className="py-3 px-3 text-text-secondary text-xs font-mono">
                        {incident.reportedAt ? format(new Date(incident.reportedAt), 'HH:mm:ss') : '--'}
                      </td>
                      <td className="py-3 px-3 text-text-secondary text-xs">
                        {incident.assignedStaff || '--'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 ${incident.status === 'active'
                                ? 'bg-accent-red'
                                : incident.status === 'inprogress'
                                  ? 'bg-orange-500'
                                  : 'bg-green-500'
                              }`}
                          />
                          <span className="text-text-secondary text-xs capitalize">
                            {incident.status || '--'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedIncident(incident)}
                            className="text-accent-red text-xs hover:underline"
                          >
                            View Details
                          </button>
                          {incident.status === 'active' && (
                            <button
                              onClick={() => setBroadcastModal(incident)}
                              className="text-text-secondary text-xs hover:text-white"
                            >
                              Broadcast
                            </button>
                          )}
                          {['active', 'inprogress'].includes(incident.status) && (
                            <button
                              onClick={() => setEscalationModal(incident)}
                              className="text-text-secondary text-xs hover:text-white"
                            >
                              Emergency
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted text-sm">
                        No incidents recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {selectedIncident && (
          <IncidentDetail incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
        )}
      </div>

      {escalationModal && (
        <EscalationModal
          incident={escalationModal}
          onClose={() => setEscalationModal(null)}
          onSend={(message) => {
            updateIncident(escalationModal.id, {
              emergencyContacted: true,
              emergencyContactedAt: Date.now(),
              emergencyMessage: message,
            });
            toast.success('Emergency services notified');
            setEscalationModal(null);
          }}
        />
      )}

      {broadcastModal && (
        <BroadcastModal
          incident={broadcastModal}
          onClose={() => setBroadcastModal(null)}
          onSend={handleBroadcast}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
