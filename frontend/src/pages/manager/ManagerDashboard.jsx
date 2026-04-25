import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToAllIncidents, detachListener, auth, updateIncident } from '../../services/firebase';
import MetricCard from '../../components/MetricCard';
import SeverityBadge from '../../components/SeverityBadge';
import EscalationModal from '../../components/EscalationModal';
import IncidentDetail from './IncidentDetail';
import { formatDistanceToNow, format } from 'date-fns';
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
  reception: 'Reception',
};

const getLocationLabel = (inc) => {
  const isRoom = !isNaN(inc.roomNumber);
  const locationName = isRoom
    ? `Room ${inc.roomNumber}`
    : locationMap[inc.roomNumber?.toLowerCase()] || inc.roomNumber;
  return `${locationName}, Floor ${inc.floor}`;
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [activeSidebar, setActiveSidebar] = useState('command');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [escalationModal, setEscalationModal] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const ref = listenToAllIncidents(setIncidents);
    return () => detachListener(ref);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCount = incidents.filter((i) => i.status === 'active').length;
  const pendingCount = incidents.filter((i) => i.status === 'inprogress').length;

  const resolvedToday = incidents.filter((i) => {
    if (!i.resolvedAt) return false;
    return new Date(i.resolvedAt).toDateString() === new Date().toDateString();
  }).length;

  const avgResponse = () => {
    const resolved = incidents.filter((i) => i.resolvedAt && i.reportedAt);
    if (resolved.length === 0) return '--';
    const avg =
      resolved.reduce((sum, i) => sum + (i.resolvedAt - i.reportedAt), 0) /
      resolved.length;
    return `${(avg / 60000).toFixed(1)}m`;
  };

  const escalatedIncidents = incidents.filter((i) => {
    if (i.status !== 'active') return false;
    return Date.now() > (i.escalationTimer || i.reportedAt + 5 * 60 * 1000);
  });

  const getCountdown = (incident) => {
    const deadline =
      incident.escalationTimer || incident.reportedAt + 5 * 60 * 1000;
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      const overdue = Math.abs(remaining);
      const mins = Math.floor(overdue / 60000);
      const secs = Math.floor((overdue % 60000) / 1000);
      return `-${mins}:${secs.toString().padStart(2, '0')}`;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    auth.signOut?.();
    navigate('/manager/login');
  };

  // ── Single sidebarItems definition ──────────────────────────────────────
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
      icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM19 14h2v2h-2zM17 17h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z',
    },
  ];

  return (
    <div className="h-screen bg-navy-950 flex flex-col">

      {/* Top Navbar */}
      <nav className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden text-text-secondary hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="w-7 h-7 bg-accent-red flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-wider uppercase hidden sm:block">
            SurakshaNow
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-white text-xs font-medium block">Operations Manager</span>
            <span className="text-text-muted text-[10px]">MGR-7741</span>
          </div>
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A9BB0" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[8px] w-4 h-4 flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={handleLogout} className="text-text-muted hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className={`${showMobileSidebar ? 'block' : 'hidden'} lg:block w-56 shrink-0 bg-navy-900 border-r border-border flex flex-col absolute lg:relative z-30 h-[calc(100vh-57px)] lg:h-auto`}>
          <div className="py-4 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'analytics') navigate('/manager/analytics');
                  else if (item.id === 'qrcodes') navigate('/manager/qr-codes');
                  else setActiveSidebar(item.id);
                  setShowMobileSidebar(false);
                }}
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Active Incidents" value={activeCount} pulse={activeCount > 0} />
            <MetricCard label="Pending Response" value={pendingCount} />
            <MetricCard label="Resolved Today" value={resolvedToday} />
            <MetricCard label="Avg Response" value={avgResponse()} />
          </div>

          {/* Escalation Alerts */}
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
                {escalatedIncidents.map((inc) => (
                  <div key={inc.id} className="card border-l-4 border-l-accent-red animate-pulse-red">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="bg-navy-600 text-text-secondary text-[10px] px-2 py-0.5 font-mono">
                          {inc.id?.substring(0, 8)}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <SeverityBadge severity={inc.severity} />
                          <span className="text-white text-xs">
                            {inc.type || inc.incidentType}
                          </span>
                        </div>
                      </div>
                      <span className="text-accent-red text-lg font-mono font-bold">
                        {getCountdown(inc)}
                      </span>
                    </div>
                    <p className="text-white text-lg font-bold mb-1">
                      {getLocationLabel(inc)}
                    </p>
                    <p className="text-text-muted text-xs mb-3">
                      Reported{' '}
                      {inc.reportedAt
                        ? formatDistanceToNow(new Date(inc.reportedAt), { addSuffix: true })
                        : ''}
                    </p>
                    <button
                      onClick={() => setEscalationModal(inc)}
                      className="btn-primary w-full text-xs py-2"
                    >
                      Contact Emergency
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Incidents Log */}
          <div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">
              All Incidents Log
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    {['INC ID', 'Type', 'Severity', 'Location', 'Time (UTC)', 'Staff', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-text-muted text-[10px] uppercase tracking-wider font-medium py-3 px-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc, i) => (
                    <tr
                      key={inc.id}
                      className={`border-b border-border ${
                        i % 2 === 0 ? 'bg-navy-900' : 'bg-navy-950'
                      } hover:bg-navy-750 transition-colors`}
                    >
                      <td className="py-3 px-3 text-text-secondary text-xs font-mono">
                        #{inc.id?.substring(0, 8)}
                      </td>
                      <td className="py-3 px-3 text-white text-xs">
                        {inc.type || inc.incidentType || '--'}
                      </td>
                      <td className="py-3 px-3">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="py-3 px-3 text-white text-xs">
                        {getLocationLabel(inc)}
                      </td>
                      <td className="py-3 px-3 text-text-secondary text-xs font-mono">
                        {inc.reportedAt
                          ? format(new Date(inc.reportedAt), 'HH:mm:ss')
                          : '--'}
                      </td>
                      <td className="py-3 px-3 text-text-secondary text-xs">
                        {inc.assignedStaff || '--'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 ${
                              inc.status === 'active'
                                ? 'bg-accent-red'
                                : inc.status === 'inprogress'
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                          />
                          <span className="text-text-secondary text-xs capitalize">
                            {inc.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="text-accent-red text-xs hover:underline"
                        >
                          View Details
                        </button>
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

        {/* Incident Detail Panel */}
        {selectedIncident && (
          <IncidentDetail
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        )}

      </div>

      {/* Escalation Modal */}
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

    </div>
  );
};

export default ManagerDashboard;