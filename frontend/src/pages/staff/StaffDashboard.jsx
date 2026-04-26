import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenToAllIncidents, updateIncident, detachListener, auth } from '../../services/firebase';
import IncidentCard from '../../components/IncidentCard';
import MetricCard from '../../components/MetricCard';
import HotelMap from './HotelMap';
import TeamChat from './TeamChat';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('alerts');
  const [staffName] = useState('Staff Member');

  useEffect(() => {
    const ref = listenToAllIncidents(setIncidents);
    return () => detachListener(ref);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === 'active' || i.status === 'inprogress');
  const activeCount = incidents.filter((i) => i.status === 'active').length;
  const respondingCount = incidents.filter((i) => i.status === 'inprogress').length;

  const handleAccept = async (incident) => {
    try {
      await updateIncident(incident.id, {
        status: 'inprogress',
        assignedStaff: staffName,
      });
      toast.success(`Accepted: ${incident.type} - Room ${incident.roomNumber}`);
    } catch {
      toast.error('Failed to accept incident');
    }
  };

  const handleLogout = () => {
    auth.signOut?.();
    navigate('/staff/login');
  };

  const tabs = [
    { id: 'alerts', label: 'Active Alerts' },
    { id: 'map', label: 'Hotel Map' },
    { id: 'chat', label: 'Team Chat' },
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Top Navbar */}
      <nav className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-accent-red flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-wider uppercase hidden sm:block">ASAP</span>
        </div>
        <span className="text-white text-xs font-medium hidden sm:block">{staffName} — Response Staff</span>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A9BB0" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[8px] w-4 h-4 flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={handleLogout} className="text-text-muted hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="px-4 sm:px-6 pt-4 flex gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'tab-active text-sm' : 'tab-inactive text-sm'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'alerts' && (
          <div className="max-w-6xl mx-auto">
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Active Incidents" value={activeCount} pulse={activeCount > 0} />
              <MetricCard label="Responders On-Site" value={respondingCount} />
              <MetricCard label="Avg Response Time" value="3.2m" />
              <MetricCard label="System Status" value="Online" />
            </div>

            {/* Incident List */}
            <div className="space-y-3">
              {activeIncidents.length > 0 ? (
                activeIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    isStaff={true}
                    onAccept={handleAccept}
                    onViewMap={() => setActiveTab('map')}
                  />
                ))
              ) : (
                <div className="card-dark text-center py-12">
                  <p className="text-text-muted text-sm">No active incidents</p>
                  <p className="text-text-muted text-xs mt-1">System monitoring active</p>
                </div>
              )}
            </div>

            {/* Live Asset Tracking */}
            <div className="mt-6">
              <h3 className="text-text-muted text-[10px] uppercase tracking-wider font-medium mb-3">
                Live Asset Tracking
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Fire Extinguishers', value: '24/24', status: 'ok' },
                  { label: 'First Aid Kits', value: '12/12', status: 'ok' },
                  { label: 'AED Units', value: '6/6', status: 'ok' },
                  { label: 'CCTV Active', value: '98%', status: 'ok' },
                ].map((asset, i) => (
                  <div key={i} className="card-dark p-3">
                    <span className="text-text-muted text-[9px] uppercase tracking-wider block">{asset.label}</span>
                    <span className="text-white text-sm font-semibold">{asset.value}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500" />
                      <span className="text-green-400 text-[9px] uppercase">{asset.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && <HotelMap incidents={incidents} />}
        {activeTab === 'chat' && <TeamChat incidents={incidents} />}
      </div>
    </div>
  );
};

export default StaffDashboard;
