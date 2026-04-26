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
  const [showNotifications, setShowNotifications] = useState(false);

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
          <img
            src="/asap.png"
            alt="ASAP Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <span className="text-white text-xs font-medium hidden sm:block">{staffName} — Response Staff</span>
        <div className="flex items-center gap-3">
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
                        onClick={() => { setShowNotifications(false); setActiveTab('alerts'); }}
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
                            {inc.locationName || (inc.roomNumber ? `Room ${inc.roomNumber}` : (inc.floor ? `Floor ${inc.floor}` : 'Location unknown'))} 
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
                {activeIncidents.length > 0 && (
                  <div 
                    className="p-2 border-t border-border bg-navy-950 text-center text-[10px] text-accent-red font-semibold uppercase tracking-wider cursor-pointer hover:bg-navy-900 transition-colors"
                    onClick={() => { setShowNotifications(false); setActiveTab('alerts'); }}
                  >
                    View All Incidents
                  </div>
                )}
              </div>
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
